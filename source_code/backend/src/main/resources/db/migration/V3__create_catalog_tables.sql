CREATE TABLE business_profile (
    id UUID PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    service_radius_km INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE halls (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    capacity_min INTEGER NOT NULL DEFAULT 0,
    capacity_max INTEGER NOT NULL,
    description TEXT,
    image_url TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_halls_capacity CHECK (capacity_min >= 0 AND capacity_max >= capacity_min)
);

CREATE TABLE dish_categories (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE dishes (
    id UUID PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES dish_categories(id),
    name VARCHAR(160) NOT NULL,
    description TEXT,
    image_url TEXT,
    sale_price NUMERIC(14,2) NOT NULL,
    serving_unit VARCHAR(30) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_dishes_price CHECK (sale_price >= 0)
);
CREATE INDEX idx_dishes_category ON dishes(category_id);
CREATE INDEX idx_dishes_name ON dishes(name);

CREATE TABLE additional_services (
    id UUID PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    description TEXT,
    price NUMERIC(14,2) NOT NULL,
    pricing_unit VARCHAR(20) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_services_price CHECK (price >= 0)
);
