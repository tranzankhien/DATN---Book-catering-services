ALTER TABLE orders
    ADD COLUMN event_latitude NUMERIC(9,6),
    ADD COLUMN event_longitude NUMERIC(9,6),
    ADD CONSTRAINT orders_event_coordinates_check CHECK (
        (event_latitude IS NULL AND event_longitude IS NULL)
        OR (event_latitude IS NOT NULL AND event_longitude IS NOT NULL
            AND event_latitude BETWEEN -90 AND 90 AND event_longitude BETWEEN -180 AND 180)
    );
