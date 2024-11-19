export default {
  transform: {
    '^.+\\.js$': 'babel-jest',  // Убедитесь, что babel правильно настроен
  },
    testEnvironment: 'node',
  collectCoverage: true,              // Включаем сбор покрытия
  coverageDirectory: 'coverage',      // Папка для хранения отчетов
  coverageReporters: ['json', 'html'], // Указываем формат отчетов, включая HTML
  testEnvironment: 'node', 
  };
  