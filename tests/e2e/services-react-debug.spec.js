import { test, expect } from '@playwright/test';

test.describe('Debug React Component State', () => {
  test('check if categories data is loaded in React component', async ({ page }) => {
    console.log('Navigating to services page...');
    await page.goto('http://localhost:8080/services');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Inject JavaScript to check React component state
    const reactDebugInfo = await page.evaluate(() => {
      // Try to find the root React component
      const root = document.querySelector('#root');
      if (!root) return { error: 'No React root found' };
      
      // Check if we can access React DevTools or component state
      try {
        // Look for any global variables that might contain the data
        return {
          windowKeys: Object.keys(window).filter(key => key.includes('react') || key.includes('categories') || key.includes('services')),
          rootChildrenCount: root.children.length,
          hasConsoleLog: typeof console.log === 'function',
          // Try to find elements that might contain category data
          categoryButtonsInDOM: document.querySelectorAll('button').length,
          gridElementsCount: document.querySelectorAll('.grid').length,
          groupElementsCount: document.querySelectorAll('.group').length
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    
    console.log('React Debug Info:', JSON.stringify(reactDebugInfo, null, 2));
    
    // Let's check if we can temporarily modify the component to debug the categories
    // We'll add a temporary debug div to the page
    await page.evaluate(() => {
      const debugDiv = document.createElement('div');
      debugDiv.id = 'debug-categories';
      debugDiv.style.position = 'fixed';
      debugDiv.style.top = '0';
      debugDiv.style.right = '0';
      debugDiv.style.background = 'red';
      debugDiv.style.color = 'white';
      debugDiv.style.padding = '10px';
      debugDiv.style.zIndex = '9999';
      debugDiv.innerHTML = 'Debug: Checking for categories...';
      document.body.appendChild(debugDiv);
      
      // Try to access any React internals
      setTimeout(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const buttonTexts = buttons.map(b => b.textContent);
        debugDiv.innerHTML = `Debug: Buttons found: ${buttonTexts.join(', ')}`;
      }, 1000);
    });
    
    await page.waitForTimeout(2000);
    
    // Take a screenshot to see the debug info
    await page.screenshot({ path: 'test-results/react-debug.png', fullPage: true });
    
    // Check if the debug div is showing the expected data
    const debugDiv = page.locator('#debug-categories');
    if (await debugDiv.count() > 0) {
      const debugText = await debugDiv.textContent();
      console.log('Debug div text:', debugText);
    }
    
    // Let's also manually trigger some console.log from the frontend
    const manualDebugResult = await page.evaluate(async () => {
      // Simulate what the useServiceCategories hook should be doing
      try {
        const response = await fetch('http://localhost:3001/api/categories');
        const data = await response.json();
        
        return {
          success: true,
          categoriesCount: data.categories?.length || 0,
          firstCategory: data.categories?.[0]?.name || 'none',
          allCategoryNames: data.categories?.map(c => c.name) || []
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });
    
    console.log('Manual API call result:', JSON.stringify(manualDebugResult, null, 2));
  });
});