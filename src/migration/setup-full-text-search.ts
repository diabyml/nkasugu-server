import { MigrationInterface, QueryRunner } from "typeorm";

export class SetupFullTextSearch1552096655610 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
    update product set document_with_weights = setweight(to_tsvector(name), 'A') ||
  setweight(to_tsvector(slug), 'B') ||
    setweight(to_tsvector(coalesce(description, '')), 'C');

CREATE INDEX document_weights_idx
  ON product
  USING GIN (document_with_weights);

        CREATE FUNCTION p_tsvector_trigger() RETURNS trigger AS $$
begin
  new.document_with_weights :=
  setweight(to_tsvector('english', coalesce(new.name, '')), 'A')
  || setweight(to_tsvector('english', coalesce(new.slug, '')), 'B')
  || setweight(to_tsvector('english', coalesce(new.description, '')), 'C');
  return new;
end
$$ LANGUAGE plpgsql;

CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
    ON product FOR EACH ROW EXECUTE PROCEDURE p_tsvector_trigger();
        `);
  }

  public async down(): Promise<any> {}
}
