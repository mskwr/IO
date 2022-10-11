#!/bin/sh

# Session manager secret, used to sign session IDs
[ -z "$EXPRESS_SESSION_SECRET" ] && export EXPRESS_SESSION_SECRET="gambit-session-secret"
# Oracle Database connection parameters
[ -z "$ORACLE_USER" ]   && export ORACLE_USER="ab123456"
[ -z "$ORACLE_PASS" ]   && export ORACLE_PASS="password"
[ -z "$ORACLE_HOST" ]   && export ORACLE_HOST="labora.mimuw.edu.pl"
[ -z "$ORACLE_DBNAME" ] && export ORACLE_DBNAME="labs"

exec $@
