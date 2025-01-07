export function getWordDeclension(number: number, forms: [string, string, string]): string {
    const absNumber = Math.ceil(Math.abs(number)); // Handle negative numbers
    const lastDigit = absNumber % 10;
    const lastTwoDigits = absNumber % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
        // Genitive plural for 11-14
        return `${absNumber} ${forms[2]}`;
    }

    if (lastDigit === 1) {
        // Nominative singular
        return `${absNumber} ${forms[0]}`;
    }

    if (lastDigit >= 2 && lastDigit <= 4) {
        // Genitive singular
        return `${absNumber} ${forms[1]}`;
    }

    // Genitive plural
    return `${absNumber} ${forms[2]}`;
}

/*

{% macro declension(count, singular, genitive_singular, genitive_plural) %}
{% set mod = count % 100 %}
{% set last_digit = count % 10 %}
{% if mod >= 11 and mod <= 14 %} {{ count }} {{ genitive_plural }} {% else %} {% if last_digit==1 %} {{ count }} {{
    singular }} {% elif last_digit>= 2 and last_digit <= 4 %} {{ count }} {{ genitive_singular }} {% else %} {{ count }}
        {{ genitive_plural }} {% endif %} {% endif %} {% endmacro %}
         */
