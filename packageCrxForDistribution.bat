@echo off

REM  -----------------------------------------------------------------------------------------------------------------
REM  This is a Community Contribution utility and is not supported or maintained by SAP, so use this at your own risk!
REM  -----------------------------------------------------------------------------------------------------------------

REM  Change to the app folder which is the folder this batch file is run from
pushd "%~dp0%"

set PKGNAME=digitalboardroom-multidesktop-fullscreen-chrome
set SRC=src
set EXTFOLDER=%CD%\%SRC%
set PEMNAME=%PKGNAME%.pem
echo.Creating package: %PKGNAME%.crx
echo.From folder: %EXTFOLDER%
echo.To folder: %CD%

REM  Use Google Chrome to package the app into a ".CRX" file for distribution.
"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" "--pack-extension=%EXTFOLDER%" "--pack-extension-key=%CD%\%PEMNAME%"

REM  Change back to the folder we were in before we called "pushd"
popd