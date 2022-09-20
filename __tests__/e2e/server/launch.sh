#!/bin/bash

# Start the first process
java -jar otp-1.4.0-shaded.jar --server --autoScan --basePath /tmp/otp --insecure --router default &  

# Start the second process
java -jar datatools-server-3.8.1-SNAPSHOT.jar /config/env.yml /config/server.yml & 

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $? 