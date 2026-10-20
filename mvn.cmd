@echo off
set "MAVEN_HOME=%~dp0tools\apache-maven-3.9.6"
"%MAVEN_HOME%\bin\mvn.cmd" %*
