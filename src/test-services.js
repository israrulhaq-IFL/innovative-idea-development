// Test to verify service instantiation works correctly
import { getConfig } from '../config/environment.js';
import SharePointService from '../services/sharePointService.js';
import dataService from '../services/dataService.js';

console.log('Testing service instantiation...');

// Test 1: getConfig should work
try {
  const config = getConfig();
  console.log('✅ getConfig() works:', config.APP.NAME);
} catch (error) {
  console.error('❌ getConfig() failed:', error);
}

// Test 2: SharePointService should instantiate
try {
  const spService = new SharePointService();
  console.log('✅ SharePointService constructor works');
} catch (error) {
  console.error('❌ SharePointService constructor failed:', error);
}

// Test 3: dataService should work
try {
  const ds = dataService();
  console.log('✅ dataService() works');
  const departments = ds.getDepartments();
  console.log('✅ getDepartments() works:', departments.length, 'departments');
} catch (error) {
  console.error('❌ dataService() failed:', error);
}

console.log('Service instantiation test complete.');