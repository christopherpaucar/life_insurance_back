import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAuditSystem1749060263429 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DO $$ 
            BEGIN
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
                    DROP TABLE audit_logs;
                END IF;
            END $$;

            CREATE TABLE audit_logs (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                table_name VARCHAR(255) NOT NULL,
                record_id TEXT NOT NULL,
                action VARCHAR(10) NOT NULL,
                old_data JSONB,
                new_data JSONB,
                user_id UUID,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE OR REPLACE FUNCTION audit_trigger_function()
            RETURNS TRIGGER AS $$
            DECLARE
                audit_row audit_logs;
                excluded_columns TEXT[] = ARRAY['created_at', 'updated_at'];
            BEGIN
                audit_row = ROW(
                    uuid_generate_v4(),
                    TG_TABLE_NAME,
                    CASE
                        WHEN TG_OP = 'DELETE' THEN OLD.id::TEXT
                        ELSE NEW.id::TEXT
                    END,
                    TG_OP,
                    CASE
                        WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) - excluded_columns
                        WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) - excluded_columns
                        ELSE NULL
                    END,
                    CASE
                        WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW) - excluded_columns
                        WHEN TG_OP = 'UPDATE' THEN to_jsonb(NEW) - excluded_columns
                        ELSE NULL
                    END,
                    current_setting('app.current_user_id', TRUE),
                    CURRENT_TIMESTAMP
                );

                INSERT INTO audit_logs VALUES (audit_row.*);
                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;

            CREATE OR REPLACE FUNCTION create_audit_triggers()
            RETURNS void AS $$
            DECLARE
                table_record RECORD;
            BEGIN
                FOR table_record IN 
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_type = 'BASE TABLE'
                    AND table_name != 'audit_logs'
                LOOP
                    EXECUTE format('
                        DROP TRIGGER IF EXISTS audit_%I_trigger ON %I;
                        CREATE TRIGGER audit_%I_trigger
                            AFTER INSERT OR UPDATE OR DELETE ON %I
                            FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
                    ', 
                    table_record.table_name,
                    table_record.table_name,
                    table_record.table_name,
                    table_record.table_name
                    );
                END LOOP;
            END;
            $$ LANGUAGE plpgsql;

            SELECT create_audit_triggers();
            DROP FUNCTION create_audit_triggers();
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DO $$
            DECLARE
                table_record RECORD;
            BEGIN
                FOR table_record IN 
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_type = 'BASE TABLE'
                    AND table_name != 'audit_logs'
                LOOP
                    EXECUTE format('DROP TRIGGER IF EXISTS audit_%I_trigger ON %I;',
                        table_record.table_name,
                        table_record.table_name
                    );
                END LOOP;
            END $$;

            DROP FUNCTION IF EXISTS audit_trigger_function();
            DROP TABLE IF EXISTS audit_logs;
        `)
  }
}
