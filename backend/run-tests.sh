#!/bin/bash
# Test Runner Script for Progress Tracker Backend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_color() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

# Print header
print_header() {
    echo ""
    print_color "$BLUE" "=========================================="
    print_color "$BLUE" "$1"
    print_color "$BLUE" "=========================================="
    echo ""
}

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_color "$RED" "❌ npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    print_color "$RED" "❌ package.json not found. Please run this script from the backend directory."
    exit 1
fi

# Parse command line arguments
TEST_TYPE="${1:-all}"
COVERAGE="${2:-true}"

print_header "🧪 Progress Tracker Test Runner"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_color "$YELLOW" "📦 Installing dependencies..."
    npm install
fi

# Run tests based on type
case "$TEST_TYPE" in
    "all")
        print_header "Running All Tests"
        if [ "$COVERAGE" = "true" ]; then
            npm test -- --coverage
        else
            npm test
        fi
        ;;
    
    "unit")
        print_header "Running Unit Tests"
        npm run test:unit
        ;;
    
    "integration")
        print_header "Running Integration Tests"
        npm run test:integration
        ;;
    
    "watch")
        print_header "Running Tests in Watch Mode"
        npm run test:watch
        ;;
    
    "ci")
        print_header "Running Tests in CI Mode"
        npm run test:ci
        ;;
    
    "coverage")
        print_header "Running Tests with Coverage Report"
        npm test -- --coverage
        
        # Open coverage report if available
        if [ -f "coverage/lcov-report/index.html" ]; then
            print_color "$GREEN" "✅ Coverage report generated!"
            print_color "$BLUE" "📊 Opening coverage report..."
            
            # Open based on OS
            if [[ "$OSTYPE" == "darwin"* ]]; then
                open coverage/lcov-report/index.html
            elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
                xdg-open coverage/lcov-report/index.html 2>/dev/null || print_color "$YELLOW" "Please open coverage/lcov-report/index.html manually"
            elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
                start coverage/lcov-report/index.html
            fi
        fi
        ;;
    
    "quick")
        print_header "Running Quick Tests (No Coverage)"
        npm test -- --coverage=false --maxWorkers=4
        ;;
    
    "verbose")
        print_header "Running Tests with Verbose Output"
        npm test -- --verbose
        ;;
    
    "help")
        print_header "Test Runner Help"
        echo "Usage: ./run-tests.sh [TYPE] [COVERAGE]"
        echo ""
        echo "Types:"
        echo "  all          - Run all tests (default)"
        echo "  unit         - Run only unit tests"
        echo "  integration  - Run only integration tests"
        echo "  watch        - Run tests in watch mode"
        echo "  ci           - Run tests in CI mode"
        echo "  coverage     - Run tests and open coverage report"
        echo "  quick        - Run tests without coverage (faster)"
        echo "  verbose      - Run tests with verbose output"
        echo "  help         - Show this help message"
        echo ""
        echo "Coverage:"
        echo "  true         - Generate coverage report (default)"
        echo "  false        - Skip coverage report"
        echo ""
        echo "Examples:"
        echo "  ./run-tests.sh all"
        echo "  ./run-tests.sh unit false"
        echo "  ./run-tests.sh coverage"
        echo "  ./run-tests.sh watch"
        exit 0
        ;;
    
    *)
        print_color "$RED" "❌ Unknown test type: $TEST_TYPE"
        print_color "$YELLOW" "Run './run-tests.sh help' for usage information"
        exit 1
        ;;
esac

# Check exit code
if [ $? -eq 0 ]; then
    print_color "$GREEN" "✅ Tests completed successfully!"
    
    # Show coverage summary if available
    if [ -f "coverage/coverage-summary.json" ] && [ "$COVERAGE" = "true" ]; then
        echo ""
        print_color "$BLUE" "📊 Coverage Summary:"
        
        # Extract coverage percentages (requires jq, fallback to simple display)
        if command -v jq &> /dev/null; then
            LINES=$(jq -r '.total.lines.pct' coverage/coverage-summary.json)
            STATEMENTS=$(jq -r '.total.statements.pct' coverage/coverage-summary.json)
            FUNCTIONS=$(jq -r '.total.functions.pct' coverage/coverage-summary.json)
            BRANCHES=$(jq -r '.total.branches.pct' coverage/coverage-summary.json)
            
            echo "  Lines:      ${LINES}%"
            echo "  Statements: ${STATEMENTS}%"
            echo "  Functions:  ${FUNCTIONS}%"
            echo "  Branches:   ${BRANCHES}%"
        else
            print_color "$YELLOW" "  (Install jq for detailed coverage summary)"
        fi
    fi
    
    echo ""
    print_color "$GREEN" "🎉 All tests passed!"
else
    print_color "$RED" "❌ Tests failed!"
    exit 1
fi

