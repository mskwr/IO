// Functions specific to database types.
module.exports = {
    'sqlite3': {
        // isNonUnique: determines whether an error indicates that an UNIQUE constraint (or another constraint) has been violated.
        isNonUnique: function(err) {
            return err.code === 'SQLITE_CONSTRAINT';
        }
    },
    'oracledb': {
        isNonUnique: function(err) {
            return err.errorNum === 1; // ORA-00001: Unique Constraint Violation
        }
    }
}