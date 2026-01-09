#!/bin/sh
# ----------------------------------------------------------------------------
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
# ----------------------------------------------------------------------------

set -e

MVNW_VERBOSE=${MVNW_VERBOSE:-false}

[ "$MVNW_VERBOSE" = true ] && echo "Apache Maven Wrapper Script"

WRAPPER_JAR="$(dirname "$0")/.mvn/wrapper/maven-wrapper.jar"
WRAPPER_PROPERTIES="$(dirname "$0")/.mvn/wrapper/maven-wrapper.properties"

DOWNLOAD_URL=$(grep -E "^wrapperUrl=" "$WRAPPER_PROPERTIES" | cut -d'=' -f2-)

if [ ! -f "$WRAPPER_JAR" ]; then
  [ "$MVNW_VERBOSE" = true ] && echo "Downloading Maven Wrapper jar from $DOWNLOAD_URL"
  curl -fsSL -o "$WRAPPER_JAR" "$DOWNLOAD_URL" || wget -O "$WRAPPER_JAR" "$DOWNLOAD_URL"
fi

JAVA_EXE="java"
[ -n "$JAVA_HOME" ] && JAVA_EXE="$JAVA_HOME/bin/java"

if ! command -v "$JAVA_EXE" >/dev/null 2>&1; then
  echo "ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH." >&2
  exit 1
fi

"$JAVA_EXE" -classpath "$WRAPPER_JAR" org.apache.maven.wrapper.MavenWrapperMain "$@"
