const errorHandler = (err, req, res, next) => {
    if (err.code === '100') {
        console.error('Ошибка транзакции:', err.message);
        return res.status(500).json({ error: 'Ошибка при выполнении транзакции. Пожалуйста, повторите попытку позже.' });
    } else if (err.code === 'ECONNREFUSED') {
        console.error('Ошибка подключения к базе данных:', err.message);
        return res.status(500).json({ error: 'Ошибка подключения к базе данных.' });
    }

    console.error('Неизвестная ошибка:', err.message);
    res.status(500).json({ error: 'Произошла ошибка. Пожалуйста, попробуйте позже.' });
};

export default errorHandler;

