# Campaign Automation API

A robust NestJS-based campaign automation system that allows users to create campaigns, ingest user data, and simulate sending campaigns to targeted audiences.

## 🏗️ Architecture

This project follows clean architecture principles with:
- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic
- **Repositories**: Handle data persistence
- **DTOs**: Data transfer objects with validation
- **Entities**: Database entity definitions
- **Contracts**: Interfaces for dependency injection

## 🚀 Features

- **Campaign Management**: Create, read, update, delete campaigns with target audience filtering
- **User Data Ingestion**: Upload user data via CSV or JSON files
- **Audience Targeting**: Filter users by age range and country
- **Campaign Statistics**: View detailed campaign metrics
- **Message Simulation**: Simulate sending campaigns to matching users
- **API Documentation**: Swagger/OpenAPI documentation
- **Docker Support**: Full containerization with Docker Compose
- **Comprehensive Testing**: 95%+ test coverage
- **Type Safety**: Strong TypeScript typing throughout

## 📋 Prerequisites

- Node.js 20+ 
- PostgreSQL 13+
- RabbitMQ 3.8+
- Docker & Docker Compose (optional)

## 🔧 Setup Instructions

### Option 1: Docker Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/ikarolaborda/campaign-automation-api
   cd campaign-automation-api
   ```

1.1. **Clone the frontend**
 ```bash
    git clone https://github.com/ikarolaborda/campaign-automation-frontend
 ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your desired configuration.

3. **Start with Docker Compose**
   ```bash
   docker compose --env-file .env up --build -d
   ```

4. **Access the applications:**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:3001
   - **Swagger Docs**: http://localhost:3001/api/docs
   - **RabbitMQ Management**: http://localhost:15672 (admin/admin)

### Option 2: Local Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start PostgreSQL and RabbitMQ**
   ```bash
   # Using Docker for services only
   docker-compose up postgres rabbitmq -d
   ```

3. **Set up environment variables (Optional, If you don't want to use the provided .env.example)**
   Create a `.env` file with the following variables:
   ```env
   NODE_ENV=development
   PORT=3001
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_USER=campaign_user
   POSTGRES_PASSWORD=campaign_pass
   POSTGRES_DB=campaign_automation
   RABBITMQ_URL=amqp://localhost:5672
   RABBITMQ_QUEUE=campaign_messages
   RABBITMQ_USER=admin
   RABBITMQ_PASS=admin
   ```
   

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch

# Run e2e tests
npm run test:e2e
```

Current test coverage: **97.53%**

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Swagger Documentation
Visit http://localhost:3001/api/docs for interactive API documentation.

### Main Endpoints

#### Campaigns
- `GET /api/campaigns` - List all campaigns
- `GET /api/campaigns/:id` - Get campaign by ID
- `POST /api/campaigns` - Create new campaign
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `GET /api/campaigns/:id/stats` - Get campaign statistics
- `POST /api/campaigns/:id/send` - Send campaign to matching users

#### Users
- `POST /api/users/upload` - Upload user data (CSV/JSON)

### Example API Usage

#### Create a Campaign
```bash
curl -X POST http://localhost:3001/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Sale Campaign",
    "targetAudience": {
      "ageRange": { "min": 25, "max": 45 },
      "countries": ["US", "CA", "UK"]
    },
    "messageTemplate": "Hi {name}! Special offer for {country} customers!"
  }'
```

#### Upload Users (CSV)
```bash
curl -X POST http://localhost:3001/api/users/upload \
  -F "file=@users.csv"
```

Sample CSV format:
```csv
name,email,age,country
John Doe,john@example.com,30,US
Jane Smith,jane@example.com,28,CA
```

## 🏗️ Project Structure

```
src/
├── campaign/           # Campaign module
│   ├── controllers/    # HTTP controllers
│   ├── services/       # Business logic
│   ├── repositories/   # Data access layer
│   ├── entities/       # Database entities
│   ├── dto/           # Data transfer objects
│   └── contracts/     # Interfaces
├── user/              # User module
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── entities/
│   ├── dto/
│   └── contracts/
├── messaging/         # Messaging module
│   ├── services/
│   ├── consumers/
│   └── contracts/
├── config/           # Configuration files
└── main.ts          # Application entry point

tests/                # Test files
docker/               # Docker configurations
```

## 🔨 Technology Stack

- **Backend Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Message Queue**: RabbitMQ
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest with comprehensive coverage
- **Containerization**: Docker & Docker Compose
- **Language**: TypeScript

## 🎯 Design Decisions & Assumptions

### Design Decisions
1. **Clean Architecture**: Separated concerns using contracts/interfaces for better testability
2. **Repository Pattern**: Abstracted data access for flexibility and testing
3. **DTO Validation**: Strong input validation using class-validator
4. **Message Queue**: RabbitMQ for scalable campaign message processing
5. **Database**: PostgreSQL for robust data persistence and JSONB for flexible target audience storage

### Assumptions
1. **User Data**: Users have required fields (name, email, age, country)
2. **Campaign Targeting**: Simple age range and country-based targeting
3. **Message Delivery**: Simulated delivery with realistic success rates (95% delivery, 70% open rate)
4. **File Size**: Maximum 10MB for user data uploads
5. **Data Format**: Support for CSV and JSON user data formats

## 🚦 Health Checks

The application includes health check endpoints:
- `GET /api/health` - Basic health check
- `GET /api/health/db` - Database connectivity check

## 🔒 Security Considerations

- Input validation on all endpoints
- No hardcoded secrets (uses environment variables)
- SQL injection protection via TypeORM
- File upload restrictions (type and size)
- CORS enabled for frontend integration

## 📊 Performance Considerations

- Batch processing for large user uploads
- Database indexing on frequently queried fields
- Message queue for asynchronous campaign processing
- Pagination support for large datasets

## 🔄 Development Workflow

1. **Code Style**: Prettier and ESLint configured
2. **Git Hooks**: Pre-commit hooks for code quality
3. **Testing**: Comprehensive test suite with high coverage
4. **CI/CD**: Ready for pipeline integration

## 📈 Monitoring & Logging

- Structured logging with Winston (configurable)
- Health check endpoints for monitoring
- Detailed error messages with proper HTTP status codes

## 🚀 Deployment

### Production Deployment
1. Set `NODE_ENV=production` in environment
2. Use proper database credentials
3. Configure RabbitMQ cluster for high availability
4. Set up reverse proxy (nginx/Apache)
5. Enable SSL/TLS certificates

### Scaling Considerations
- Database read replicas for heavy read workloads
- RabbitMQ clustering for message queue scaling
- Horizontal scaling with load balancers
- Redis caching for frequently accessed data

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check connection credentials in .env
   - Ensure database exists

2. **RabbitMQ Connection Issues**
   - Verify RabbitMQ is running
   - Check RABBITMQ_URL in .env
   - Verify queue permissions

3. **File Upload Issues**
   - Check file format (CSV/JSON)
   - Verify file size under 10MB
   - Ensure proper file structure

## 📝 Development Time

**Total Development Time**: ~6 hours
- Initial setup and architecture: 1 hour
- Core features implementation: 3 hours
- Testing and validation: 1.5 hours
- Documentation and Docker setup: 0.5 hours

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.
