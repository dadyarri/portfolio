mkdir ..\bin

dotnet publish OgImages/OgImages.csproj -r win-x64 -c Release
Copy-Item OgImages\bin\Release\net9.0\win-x64\publish\OgImages.exe ..\bin\OgImages.exe

dotnet publish OgImages/OgImages.csproj -r linux-x64 -c Release
Copy-Item OgImages\bin\Release\net9.0\linux-x64\publish\OgImages ..\bin\OgImages