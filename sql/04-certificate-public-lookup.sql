-- MEDAURA Certificates Phase 3: run once in Supabase SQL Editor.
-- Public lookup by university ID is intentionally unauthenticated per MEDAURA's design.
-- A university ID is not a secret. Add edge-level rate limiting before broad public launch.
BEGIN;
CREATE OR REPLACE FUNCTION public.medaura_lookup_certificates(p_student_id text)
RETURNS TABLE(id uuid, certificate_number bigint, student_name text, course_title text, issue_date date)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
 SELECT c.id,c.certificate_number,c.student_name,co.title,co.issue_date
 FROM public.medaura_certificates c
 JOIN public.medaura_certificate_courses co ON co.id=c.course_id
 WHERE c.student_university_id=trim(p_student_id)
   AND c.status='issued'
   AND length(trim(p_student_id)) BETWEEN 1 AND 100
 ORDER BY co.issue_date DESC, c.certificate_number DESC
 LIMIT 100;
$$;
CREATE OR REPLACE FUNCTION public.medaura_verify_certificate(p_certificate_id uuid)
RETURNS TABLE(certificate_number bigint, student_name text, course_title text, issue_date date, status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
 SELECT c.certificate_number,c.student_name,co.title,co.issue_date,c.status
 FROM public.medaura_certificates c
 JOIN public.medaura_certificate_courses co ON co.id=c.course_id
 WHERE c.id=p_certificate_id
 LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.medaura_lookup_certificates(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.medaura_verify_certificate(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.medaura_lookup_certificates(text) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.medaura_verify_certificate(uuid) TO anon,authenticated;
COMMIT;
