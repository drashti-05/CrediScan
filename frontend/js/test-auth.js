class AuthTest {
    static async runTests() {
        console.log('Starting Authentication Tests...');
        
        try {
            // Test Registration
            await this.testRegistration();
            
            // Test Login
            await this.testLogin();
            
            // Test Invalid Login
            await this.testInvalidLogin();
            
            console.log('All tests completed successfully!');
        } catch (error) {
            console.error('Test failed:', error);
        }
    }

    static async testRegistration() {
        console.log('Testing Registration...');
        const testUser = {
            username: 'testuser_' + Date.now(),
            password: 'test123'
        };

        try {
            const response = await API.register(testUser.username, testUser.password);
            console.assert(response.success, 'Registration should be successful');
            console.log('✅ Registration test passed');
            return testUser;
        } catch (error) {
            console.error('❌ Registration test failed:', error);
            throw error;
        }
    }

    static async testLogin() {
        console.log('Testing Login...');
        const testUser = {
            username: 'testuser_' + Date.now(),
            password: 'test123'
        };

        try {
            // Register first
            await API.register(testUser.username, testUser.password);
            
            // Then try to login
            const response = await API.login(testUser.username, testUser.password);
            console.assert(response.token, 'Login should return a token');
            console.assert(response.user, 'Login should return user data');
            console.log('✅ Login test passed');
        } catch (error) {
            console.error('❌ Login test failed:', error);
            throw error;
        }
    }

    static async testInvalidLogin() {
        console.log('Testing Invalid Login...');
        try {
            await API.login('invalid_user', 'wrong_password');
            console.error('❌ Invalid login test failed: Should not succeed');
        } catch (error) {
            console.log('✅ Invalid login test passed (expected error)');
        }
    }
} 