@echo off

REM  -----------------------------------------------------------------------------------------------------------------
REM  This is a Community Contribution utility and is not supported or maintained by SAP, so use this at your own risk!
REM  -----------------------------------------------------------------------------------------------------------------

REM  Change to the app folder which is the folder this batch file is run from
pushd "%~dp0%"

set PKGNAME=digitalboardroom-multidesktop-fullscreen-chrome
set SRC=src
set EXTFOLDER=%CD%\%SRC%

REM  Launch Google Chrome, install the unpacked app from the %CD% folder and launch it. If the app is already running it is updated.
start /b "SAP Full Screen" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" "--load-and-launch-app=%EXTFOLDER%"

REM  Change back to the folder we were in before we called "pushd"
popd