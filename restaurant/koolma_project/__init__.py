import os

if os.environ.get('USE_SQLITE', '0') != '1':
    try:
        import MySQLdb  # noqa: F401
    except ModuleNotFoundError:
        try:
            import pymysql
        except ModuleNotFoundError as exc:
            raise ModuleNotFoundError(
                "Aucun driver MySQL n'est installé (mysqlclient/MySQLdb ou PyMySQL). "
                "Installe les dépendances avec: pip install -r requirements.txt "
                "ou active SQLite temporairement avec USE_SQLITE=1."
            ) from exc

        pymysql.install_as_MySQLdb()
