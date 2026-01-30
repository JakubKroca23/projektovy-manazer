-- RE-ENABLE RLS (Bezpečnostní pojistka)
-- Nyní, když jsme opravili .select() dotazy v aplikaci, můžeme bezpečně zapnout RLS.
-- Policies z kroku 12 jsou stále platné a funkční.

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Ověření: Uživatel by měl vidět projekty díky policy "view_projects"
-- a moci je mazat díky policy "delete_projects"
