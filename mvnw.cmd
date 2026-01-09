@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    http://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@echo off
setlocal

set ERROR_CODE=0

set MVNW_VERBOSE=false
IF "%MVNW_VERBOSE%" == "true" (
  echo Apache Maven Wrapper Script for Windows
)

set WRAPPER_JAR="%~dp0\.mvn\wrapper\maven-wrapper.jar"
set WRAPPER_PROPERTIES="%~dp0\.mvn\wrapper\maven-wrapper.properties"

set DOWNLOAD_URL=
for /F "usebackq tokens=1,2 delims==" %%A in (%WRAPPER_PROPERTIES%) do (
  if "%%A"=="wrapperUrl" set DOWNLOAD_URL=%%B
)

IF NOT EXIST %WRAPPER_JAR% (
  if "%MVNW_VERBOSE%" == "true" (
    echo Downloading Maven Wrapper jar from %DOWNLOAD_URL%
  )
  powershell -Command "Try { (New-Object Net.WebClient).DownloadFile('%DOWNLOAD_URL%', '%WRAPPER_JAR%') } Catch { Write-Error $_; Exit 1 }"
  if ERRORLEVEL 1 goto error
)

set JAVA_EXE=java.exe
if defined JAVA_HOME set JAVA_EXE=%JAVA_HOME%\bin\java.exe

if not exist "%JAVA_EXE%" (
  echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
  echo Please set the JAVA_HOME variable in your environment to match the
  echo location of your Java installation.
  goto error
)

set MAVEN_PROJECTBASEDIR=%~dp0

"%JAVA_EXE%" -Dmaven.multiModuleProjectDirectory="%MAVEN_PROJECTBASEDIR%" -classpath %WRAPPER_JAR% org.apache.maven.wrapper.MavenWrapperMain %*
if ERRORLEVEL 1 goto error
goto end

:error
set ERROR_CODE=1

:end
@endlocal & set ERROR_CODE=%ERROR_CODE%
exit /B %ERROR_CODE%
