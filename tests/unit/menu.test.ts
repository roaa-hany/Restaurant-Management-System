/**
 * Unit tests for Menu API endpoints
 */

import request from 'supertest';
import { app, resetDataStores } from '../../src/server';
import { sampleMenuItems } from '../../src/data/sampleData';

describe('Menu API Endpoints', () => {
  beforeEach(() => {
    resetDataStores();
  });

  describe('GET /api/menu', () => {
    it('should return all menu items', async () => {
      const response = await request(app)
        .get('/api/menu')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(sampleMenuItems.length);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('price');
      expect(response.body[0]).toHaveProperty('category');
    });

    it('should return menu items with correct structure', async () => {
      const response = await request(app)
        .get('/api/menu')
        .expect(200);

      const item = response.body[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('price');
      expect(item).toHaveProperty('category');
      expect(item).toHaveProperty('imageUrl');
      expect(item).toHaveProperty('ingredients');
      expect(item).toHaveProperty('allergens');
      expect(Array.isArray(item.ingredients)).toBe(true);
      expect(Array.isArray(item.allergens)).toBe(true);
    });
  });

  describe('GET /api/menu/:id', () => {
    it('should return a specific menu item by ID', async () => {
      const menuItemId = sampleMenuItems[0].id;
      const response = await request(app)
        .get(`/api/menu/${menuItemId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', menuItemId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('price');
    });

    it('should return 404 for non-existent menu item', async () => {
      const response = await request(app)
        .get('/api/menu/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Menu item not found');
    });
  });

  describe('GET /api/menu/category/:category', () => {
    it('should return menu items filtered by category', async () => {
      const category = 'main';
      const response = await request(app)
        .get(`/api/menu/category/${category}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      response.body.forEach((item: any) => {
        expect(item.category).toBe(category);
      });
    });

    it('should return empty array for category with no items', async () => {
      // Assuming 'invalid-category' doesn't exist
      const response = await request(app)
        .get('/api/menu/category/invalid-category')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(0);
    });

    it('should filter by appetizer category', async () => {
      const response = await request(app)
        .get('/api/menu/category/appetizer')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      response.body.forEach((item: any) => {
        expect(item.category).toBe('appetizer');
      });
    });

    it('should filter by dessert category', async () => {
      const response = await request(app)
        .get('/api/menu/category/dessert')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      response.body.forEach((item: any) => {
        expect(item.category).toBe('dessert');
      });
    });

    it('should filter by beverage category', async () => {
      const response = await request(app)
        .get('/api/menu/category/beverage')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      response.body.forEach((item: any) => {
        expect(item.category).toBe('beverage');
      });
    });
  });
});

