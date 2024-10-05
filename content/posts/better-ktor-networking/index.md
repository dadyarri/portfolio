+++
title = "Ktor для сетевых запросов в мобильном приложении"
date = "2024-03-08"
draft = false

[taxonomies]
tags = ["Android", "Kotlin"]

[extra]
comment = true
toc = true
+++

Работая над сетевым взаимодействием в мобильных приложениях, я долго искал инструмент, который бы сочетал в себе простоту и мощь. И нашёл его в Ktor. В этой статье я поделюсь своим опытом использования Ktor и объясню, почему он стал моим фаворитом для создания надежных и эффективных сетевых решений в Kotlin-приложениях.

<!--more-->

# Установка зависимостей

В `build.gradle.kts` уровня проекта добавим плагин сериализатора:

```kt
plugins {
    // ...
    kotlin("plugin.serialization") version "1.9.22" apply false
}
```

В `build.gradle.kts` уровня модуля добавим следующие зависимости:

```kt
dependencies {
    // ...
    val ktorVersion = "2.3.8"

    implementation("io.ktor:ktor-client-core:$ktorVersion") // Базовая клиентская библиотека
    implementation("io.ktor:ktor-client-android:$ktorVersion") // Плагин для работы в Android
    implementation("io.ktor:ktor-client-content-negotiation:$ktorVersion") // Плагины для парсинга JSON в модели и обратно
    implementation("io.ktor:ktor-serialization-kotlinx-json:$ktorVersion")
    implementation("io.ktor:ktor-client-serialization:$ktorVersion")
    implementation("io.ktor:ktor-client-logging:$ktorVersion") // Плагин для логгирования
    implementation("ch.qos.logback:logback-classic:1.2.11")  // Драйвер логгирования (последняя подддерживаемая в Android версия)
}
```

Так же понадобится активировать плагин в файле уровня модуля:

```kt

plugins {
    // ...
    kotlin("plugin.serialization")
}

```

# Настройка клиента

В этот раз я решил избавиться от механизма, при котором пользователь выбирает базовый URL сервера, на который делаются все запросы, поэтому зададим этот адрес прямо здесь константой и настроим клиент так, чтобы он всегда использовал этот адрес для всех запросов:

```kt
import io.ktor.client.HttpClient
import io.ktor.client.engine.android.Android
import io.ktor.client.plugins.DefaultRequest
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.defaultRequest
import io.ktor.client.plugins.logging.LogLevel
import io.ktor.client.plugins.logging.Logging
import io.ktor.serialization.kotlinx.json.json

object HttpClientFactory {
    const val baseUrl = "demo.uni-edu.ru/api/v2"
    val httpClient: HttpClient by lazy {
        HttpClient(Android) {
            install(Logging) {
                level = LogLevel.ALL
            }

            install(ContentNegotiation) {
                json()
            }

            install(DefaultRequest)

            defaultRequest {
                url(scheme = "https", host = baseUrl)
            }
        }
    }
}
```

Lazy позволяет не создавать клиент на старте приложения. Он будет создан при первом обращении к полю. Так, мы сможем в любом месте приложения обращаться к одному и тому же клиенту.

# Типизированные ответы

В новой версии моего API сервер всегда возвращает одну структуру, которую примерно можно описать так:

```json
{
	"value": {},
	"status": 0,
	"isSuccess": true,
	"successMessage": "string",
	"correlationId": "string",
	"errors": ["string"],
	"validationErrors": [
		{
			"identifier": "string",
			"errorMessage": "string",
			"errorCode": "string",
			"severity": 0
		}
	]
}
```

При этом `$.value` может быть как объектом, так и списком, в зависимости от конкретного метода API. Поэтому напишем обёртку с обобщённым параметром, объект которой будем создавать при парсинге ответа:

```kt
import kotlinx.serialization.Serializable

@Serializable
data class ResponseWrapper<T>(
    val value: T?,
    val status: Int,
    val isSuccess: Boolean,
    val successMessage: String,
    val correlationId: String,
    val errors: List<String>,
    val validationErrors: List<ValidationError>
)

```

```kt
@Serializable
data class ValidationError(
    val identifier: String,
    val errorMessage: String,
    val errorCode: String,
    val severity: Int
)
```

Кроме того, понадобится упрощённая версия этого объекта, с которой уже и будет работать код, вызывающий сетевые запросы.

```kt
data class Response<T>(
    val isSuccess: Boolean,
    val value: T?,
    val errorMessage: String?
)
```

# Отправка запросов

Теперь добавим метод расширения `safeRequest` к `HttpClient`:

```kt

import io.ktor.client.HttpClient
import io.ktor.client.plugins.ClientRequestException
import io.ktor.client.plugins.ServerResponseException
import io.ktor.client.request.HttpRequestBuilder
import io.ktor.client.request.header
import io.ktor.client.request.request
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.utils.io.errors.IOException


suspend inline fun <reified T> HttpClient.safeRequest(block: HttpRequestBuilder.() -> Unit): Response<T> {
    return try {
        val response = request {
            block()
            header(HttpHeaders.Accept, ContentType.Application.Json)
        }

        when (response.status) {
            HttpStatusCode.OK -> Response(
                isSuccess = true,
                value = response.parseBody<T>()!!.value,
                errorMessage = null
            )

            HttpStatusCode.Unauthorized -> Response(
                isSuccess = false,
                errorMessage = response.headers["www-authenticate"] ?: "Не авторизован", // Можно использовать заголовки ответа
                value = null
            )

            HttpStatusCode.NotFound -> Response(
                isSuccess = false,
                errorMessage = "Не найдено: ${response.parseBody<T>()!!.errors[0]}", // Можно использовать тело ответа. О том, что такое parseBody — ниже
                value = null
            )

            // Добавить другие обработчики по коду ответа

            else -> {
                Response(isSuccess = false, value = null, errorMessage = "Неизвестная ошибка")
            }
        }

    // Обработчики исключений, которые могут произойти тоже возвращают такой же объект ответа
    } catch (e: ClientRequestException) {
        Response(isSuccess = false, value = null, errorMessage = "Ошибка на клиенте")
    } catch (e: ServerResponseException) {
        Response(isSuccess = false, value = null, errorMessage = "Ошибка на сервере")
    } catch (e: IOException) {
        Response(isSuccess = false, value = null, errorMessage = "Ошибка сети")
    } catch (e: SerializationException) {
        Response(isSuccess = false, value = null, errorMessage = "Ошибка парсинга данных")
    }
}

```

Он позволяет безопасно делать запросы в сеть, обрабатывая исключения и возвращая разные объекты в зависимости от кода ответа

Кроме того, нужен ещё один метод, расширяющий HttpResponse, который парсит ответ из JSON-строки в объект `ResponseWrapper<T>`:

```kt

import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json

suspend inline fun <reified T> HttpResponse.parseBody(): ResponseWrapper<T>? {
    val json = Json { ignoreUnknownKeys = true }
    return try {
        val stringBody = bodyAsText()
        json.decodeFromString<ResponseWrapper<T>>(stringBody)
    } catch (e: SerializationException) {
        null
    }
}

```
Если ваш сервер не возвращает единую структуру для всех ответов, метод можно переписать так:

{% note(clickable=true, hidden = true, header="Модификации") %}


```kt

import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json

suspend inline fun <reified T> HttpResponse.parseBody(): T? {
    val json = Json { ignoreUnknownKeys = true }
    return try {
        val stringBody = bodyAsText()
        json.decodeFromString<T>(stringBody)
    } catch (e: SerializationException) {
        null
    }
}

```

Так же, нужно будет изменить код, который обращается к телу запроса через `parseBody<T>`. Например так:

```kt


HttpStatusCode.OK -> Response(
    isSuccess = true,
    value = response.parseBody<T>(),
    errorMessage = null
)

```

{% end %}

# Выполнение запросов

Запросы будут выполняться в отдельных классах сервисов. Напишем один такой:

```kt

import io.ktor.client.request.accept
import io.ktor.client.request.headers
import io.ktor.client.request.setBody
import io.ktor.client.request.url
import io.ktor.http.ContentType
import io.ktor.http.HttpMethod
import io.ktor.http.contentType
import ru.aip.intern.domain.auth.data.LoginRequest
import ru.aip.intern.domain.auth.data.LoginResponse
import ru.aip.intern.networking.HttpClientFactory
import ru.aip.intern.networking.Response
import ru.aip.intern.networking.safeRequest

class AuthService(private val token: String) {
    suspend fun logIn(request: LoginRequest, fcmToken: String): Response<LoginResponse> {
        val httpClient = HttpClientFactory.httpClient
        return httpClient.safeRequest {
            method = HttpMethod.Post
            url("/auth/log-in")
            setBody(request)
            contentType(ContentType.Application.Json)
            accept(ContentType.Application.Json)
            headers {
                append("x-FCM-Token", fcmToken)
            }
        }
    }
}

```

Каждый метод в сервисе — это неблокирующая функция, которая берёт общий объект HTTP клиента и использует его, чтобы вызвать `safeRequest`. Она возвращает упрощённый `Response<T>`, где T — это объект ответа, находящийся в `$.value` исходного ответа.

Ответ всегда выглядит как data class с аннотацией `@Serializable`:

```kt
import kotlinx.serialization.Serializable

@Serializable
data class LoginResponse(
    val accessToken: String
)
```

Если в модели используются типы из Java, для которых в ktor нет своего сериализатора (например UUID, который я использую для идентификаторов), потребуется написать свой сериализатор:

```kt
import kotlinx.serialization.KSerializer
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import java.util.UUID

object UuidSerializer : KSerializer<UUID> {
    override val descriptor = PrimitiveSerialDescriptor("UUID", PrimitiveKind.STRING)

    override fun deserialize(decoder: Decoder): UUID {
        return UUID.fromString(decoder.decodeString())
    }

    override fun serialize(encoder: Encoder, value: UUID) {
        encoder.encodeString(value.toString())
    }
}
```

На поле в модели сериализатор добавляется так:

```kt
@Serializable(UuidSerializer::class)
val id: UUID
```

# Работа с ответами

Запросы выполняются во viewModel, внедряемой в экраны, которым это нужно

```kt

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import ru.aip.intern.domain.auth.data.LoginRequest
import ru.aip.intern.storage.DataStoreRepository
import javax.inject.Inject

@HiltViewModel
class LoginViewModel @Inject constructor(val storage: DataStoreRepository) : ViewModel() {
    private val _email = MutableLiveData("")
    val email: LiveData<String> = _email

    private val _password = MutableLiveData("")
    val password: LiveData<String> = _password

    private val _snackbarMessage = MutableSharedFlow<String>()
    val snackbarMessage = _snackbarMessage

    private val _service = AuthService("") // нужно добавить код, относящийся к получению токена (например, из DataStore)

    fun login(redirect: () -> Unit) {

        viewModelScope.launch {
            val request = LoginRequest(email.value!!, password.value!!)
            var fcmToken = "" // Я использую Firebase для получения уведомлений, ниже должен быть код, получающий FCM токен

            val response = _service.logIn(request, fcmToken) // Делаем запрос на сервер

            if (response.isSuccess) { // Обрабатываем результат
                // Сохраняем полученный токен в хранилище (`value` здесь не может быть равен `null`, так как запрос завершился успешно)
                storage.saveApiKey(response.value!!.accessToken)
                redirect()
            } else {
                // Показываем сообщение с ошибкой пользователю, если запрос провалился. `errorMessage` здесь аналогично не может быть равен `null`
                triggerSnackbar(response.errorMessage!!)
            }
        }
    }

    private fun triggerSnackbar(message: String) {
        viewModelScope.launch {
            _snackbarMessage.emit(message)
        }
    }
}

```

# Интерфейс пользователя

Ну и последний этап — добавим отображение ошибок на экране. Для этого Composable функция должна подписаться на изменения snackbarMessage из viewModel:

```kt

val viewModel: LoginViewModel = hiltViewModel()

LaunchedEffect(key1 = true) {
    viewModel.snackbarMessage.collect { message ->
        snackbarHostState.showSnackbar(message)
    }
}

```

Здесь `snackbarHostState` это аргумент, который приходит из главного компонента. Создаётся он так:

```kt

val snackbarHostState = remember { SnackbarHostState() }

Scaffold(
    // ...
    snackbarHost = {
        SnackbarHost(hostState = snackbarHostState)
    }
) { innerPadding ->
    NavHost(/****/) {
        composable(Screen.Login.name) {
            LoginScreen(snackbarHostState)
        }
    }
}

```

# Заключение

Вот так можно реализовать удобные походы в сеть с помощью ktor в вашем Android-приложении на Jetpack Compose. Полный исходный код приложения можно посмотреть в [репозитории](https://github.com/uni-lms/Applications/tree/master)
