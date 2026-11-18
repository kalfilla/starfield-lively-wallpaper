@echo off
setlocal

set "SOURCE=%~dp0"
set "DEST=%~1"
if "%DEST%"=="" set "DEST=%SOURCE%WallpaperEngineExport"

if not exist "%DEST%" mkdir "%DEST%"
if errorlevel 1 goto :failed
if not exist "%DEST%\files" mkdir "%DEST%\files"
if errorlevel 1 goto :failed

copy /Y "%SOURCE%index.html" "%DEST%\" >nul
if errorlevel 1 goto :failed
copy /Y "%SOURCE%wallpaper-engine.html" "%DEST%\" >nul
if errorlevel 1 goto :failed
copy /Y "%SOURCE%LivelyProperties.json" "%DEST%\" >nul
if errorlevel 1 goto :failed

robocopy "%SOURCE%files" "%DEST%\files" /E /NFL /NDL /NJH /NJS /NC /NS >nul
if errorlevel 8 goto :failed

echo Wallpaper Engine package created at: %DEST%
exit /b 0

:failed
echo Failed to create the Wallpaper Engine package.
exit /b 1
