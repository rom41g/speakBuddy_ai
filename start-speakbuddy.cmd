@echo off
setlocal
pushd "%~dp0" || exit /b 1

where npm.cmd >nul 2>&1
if errorlevel 1 (
    echo Install Node.js 24 from https://nodejs.org/ and try again.
    pause
    popd
    exit /b 1
)

if not exist "node_modules\.bin\vite.cmd" (
    call npm.cmd ci
    if errorlevel 1 (
        pause
        popd
        exit /b 1
    )
)

call npm.cmd run dev -- --open
set "speakbuddy_exit=%errorlevel%"
if not "%speakbuddy_exit%"=="0" pause
popd
exit /b %speakbuddy_exit%
