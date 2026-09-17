-- =====================================================================
-- V1__init_phase1_schema.sql
-- BanquetHub Phase 1 Schema: Users, Dish Categories, Ingredients, Dishes, Recipe Items
-- =====================================================================

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(25),
    role VARCHAR(30) NOT NULL CHECK (role IN ('ROLE_USER', 'ROLE_EMPLOYEE', 'ROLE_ADMIN')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE TABLE dish_categories (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(500),
    display_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ingredients (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    min_stock_threshold NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (min_stock_threshold >= 0),
    current_stock NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    avg_unit_cost NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (avg_unit_cost >= 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ingredients_active ON ingredients(active);

CREATE TABLE dishes (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(180) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    price NUMERIC(15, 2) NOT NULL CHECK (price > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'HIDDEN')),
    category_id BIGINT NOT NULL REFERENCES dish_categories(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dishes_status ON dishes(status);
CREATE INDEX idx_dishes_category_id ON dishes(category_id);

CREATE TABLE recipe_items (
    id BIGSERIAL PRIMARY KEY,
    dish_id BIGINT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    ingredient_id BIGINT NOT NULL REFERENCES ingredients(id),
    quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
    note VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_recipe_dish_ingredient UNIQUE (dish_id, ingredient_id)
);

CREATE INDEX idx_recipe_items_dish_id ON recipe_items(dish_id);
CREATE INDEX idx_recipe_items_ingredient_id ON recipe_items(ingredient_id);
