@echo off
setlocal

set "SOURCE=%~dp0"
set "DEST=%~1"
if "%DEST%"=="" (
  set "DEST=%SOURCE%WallpaperEngineExport"
)

pushd "%SOURCE%"
call npm.cmd run build
if errorlevel 1 goto :failed
popd

if not exist "%DEST%" (
  mkdir "%DEST%"
)
if errorlevel 1 goto :failed

robocopy "%SOURCE%dist" "%DEST%" /E /NFL /NDL /NJH /NJS /NC /NS >nul
if errorlevel 8 goto :failed

echo Wallpaper Engine package created at: %DEST%
exit /b 0

:failed
echo Failed to create the Wallpaper Engine package.
exit /b 1
