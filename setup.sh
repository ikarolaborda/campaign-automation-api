#!/bin/bash

echo "🚀 Campaign Automation System Setup"
echo "=================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
# Application Configuration
NODE_ENV=development
PORT=3001

# Database Configuration
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=campaign_user
POSTGRES_PASSWORD=campaign_pass
POSTGRES_DB=campaign_automation

# RabbitMQ Configuration
RABBITMQ_URL=amqp://rabbitmq:5672
RABBITMQ_QUEUE=campaign_messages
RABBITMQ_USER=admin
RABBITMQ_PASS=admin

# GitHub Token for Submodule Access (optional)
# Required only if frontend is a private repository
# Generate at: https://github.com/settings/tokens
GITHUB_TOKEN=

# Frontend Configuration (for Docker builds)
NEXT_PUBLIC_API_URL=http://localhost:3001/api
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Check if .gitmodules exists
if [ ! -f ".gitmodules" ]; then
    echo ""
    echo "📂 Frontend Submodule Setup"
    echo "Do you want to set up the frontend as a git submodule? (y/n)"
    read -r setup_submodule
    
    if [ "$setup_submodule" = "y" ] || [ "$setup_submodule" = "Y" ]; then
        echo "Enter the frontend repository URL:"
        read -r frontend_url
        
        if [ -n "$frontend_url" ]; then
            echo "Setting up frontend submodule..."
            cat > .gitmodules << EOF
[submodule "frontend"]
	path = frontend
	url = $frontend_url
	branch = main
EOF
            
            # Initialize submodule if not already done
            if [ ! -d "frontend/.git" ]; then
                git submodule add "$frontend_url" frontend
                git submodule update --init --recursive
            fi
            echo "✅ Frontend submodule configured"
        else
            echo "❌ No URL provided, skipping submodule setup"
        fi
    else
        echo "ℹ️  Skipping frontend submodule setup"
        echo "   You can manually create .gitmodules later or use the existing frontend directory"
    fi
else
    echo "✅ .gitmodules already exists"
    
    # Update submodules if they exist
    if [ -f ".gitmodules" ]; then
        echo "🔄 Updating git submodules..."
        git submodule update --init --recursive
        echo "✅ Submodules updated"
    fi
fi

echo ""
echo "🔧 Setup Instructions"
echo "===================="
echo ""
echo "1. Edit .env file with your configuration:"
echo "   - Set GITHUB_TOKEN if frontend is a private repository"
echo "   - Adjust database/RabbitMQ settings if needed"
echo ""
echo "2. Start the application:"
echo "   docker compose up --build -d"
echo ""
echo "3. Access the application:"
echo "   - Backend API: http://localhost:3001"
echo "   - Frontend: http://localhost:3000 (if available)"
echo "   - API Docs: http://localhost:3001/api/docs"
echo "   - RabbitMQ: http://localhost:15672 (admin/admin)"
echo ""
echo "🎉 Setup complete! Run the commands above to start the application." 