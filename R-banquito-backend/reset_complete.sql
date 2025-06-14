-- Script completo para resetear la base de datos Banquito

-- 1. Eliminar todas las tablas
DROP TABLE IF EXISTS payment_history CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS loan_requests CASCADE;
DROP TABLE IF EXISTS savings_plans CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS "SequelizeMeta" CASCADE;

-- 2. Eliminar los tipos ENUM
DROP TYPE IF EXISTS enum_members_credit_rating CASCADE;
DROP TYPE IF EXISTS enum_loan_requests_status CASCADE;
DROP TYPE IF EXISTS enum_loans_status CASCADE;
DROP TYPE IF EXISTS enum_users_role CASCADE;