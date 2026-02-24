import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const chalk = require('chalk');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3000);
  console.log(chalk.green.bold('Server running on') + ' ' + chalk.cyan.underline('http://localhost:3000'));
}
bootstrap();
