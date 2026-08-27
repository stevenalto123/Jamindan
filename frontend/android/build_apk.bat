@echo off
set "JAVA_HOME=C:\PROGRA~1\Microsoft\jdk-21.0.11.10-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"
echo Setting JAVA_HOME to %JAVA_HOME%...
call .\gradlew.bat assembleDebug
