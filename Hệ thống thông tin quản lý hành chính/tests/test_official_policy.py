"""Source-backed dossier policy and original-form attachment checks."""
import base64
import io
import json
import tempfile
import unittest
import zipfile
from datetime import datetime
from pathlib import Path
from unittest.mock import patch
import app
import official_procedure_policy as policies
import procedure_workflows as workflows
from procedure_details import published_template

class OfficialPolicyTests(unittest.TestCase):
    def setUp(self):
        self.procedure = next(p for p in app.PROCEDURES if p['code']=='1.012531')
        self.schema = self.procedure['submission']
        self.profile = workflows.configured_profile(self.procedure)

    def body(self):
        fields=self.schema['fields']
        declaration={f['id']:(f['options'][0] if f.get('options') else 'Nội dung yêu cầu theo tờ khai đã điền và ký.') for f in fields}
        docs=[d for d in self.schema['documents'] if not d.get('when') or d['when']['equals']==declaration.get(d['when']['field'])]
        return {'schemaVersion':self.schema['version'],'confirmed':True,'declaration':declaration,'deliveryMethod':self.schema['deliveryMethods'][0],'documentExemptions':{d['id']:'Đề nghị cơ quan khai thác tài liệu theo căn cứ trong hồ sơ.' for d in docs}}, docs

    def test_source_fields_documents_and_procedure_identity(self):
        self.assertEqual(self.profile['kind'],'PUBLISHED_DOSSIER')
        raw=policies.official_record(self.procedure['code'])
        self.assertEqual(self.profile['officialRecordId'],raw['id'])
        self.assertEqual(self.schema['declarationMode'],'OFFICIAL_ATTACHMENTS')
        self.assertEqual(set(f['id'] for f in self.schema['fields'])-{'officialCase'}, {'requestContent'})
        self.assertEqual([s['description'] for s in self.profile['officialSteps']],[s['description'].strip() for s in raw['executionSteps']])
        self.assertTrue(self.schema['documents'])
        self.assertTrue(self.profile['legalBases'])

    def test_each_omitted_document_needs_a_substantive_reason(self):
        body,docs=self.body()
        app.validate_procedure_submission(self.procedure,body,'citizen',[])
        body['documentExemptions'].pop(docs[0]['id'])
        with self.assertRaisesRegex(ValueError,'Đính kèm hoặc ghi căn cứ'):
            app.validate_procedure_submission(self.procedure,body,'citizen',[])
        file={'componentId':docs[0]['id']}
        app.validate_procedure_submission(self.procedure,body,'citizen',[file])
        body['documentExemptions']['tampered-component']='not allowed'
        with self.assertRaisesRegex(ValueError,'không hợp lệ'):
            app.validate_procedure_submission(self.procedure,body,'citizen',[file])

    def test_authority_uses_only_published_scope(self):
        self.assertTrue(workflows.agency_matches(self.profile,'UBND phường Tây Hồ'))
        self.assertFalse(workflows.agency_matches(self.profile,'Toàn thành phố'))
        self.assertFalse(workflows.agency_matches(self.profile,'Sở Tư pháp Hà Nội'))

    def test_original_word_forms_are_validated_without_extraction(self):
        with tempfile.TemporaryDirectory() as temp:
            stream=io.BytesIO()
            with zipfile.ZipFile(stream,'w') as document:
                document.writestr('[Content_Types].xml','<Types/>')
                document.writestr('word/document.xml','<document/>')
            file={'name':'to-khai.docx','data':base64.b64encode(stream.getvalue()).decode()}
            with patch.object(app,'UPLOAD_DIR',Path(temp)):
                saved=app.save_files('WORD-TEST',[file])
                self.assertEqual(len(saved),1)
                bad={**file,'data':base64.b64encode(b'%PDF-not-word').decode()}
                with self.assertRaisesRegex(ValueError,'không khớp'):
                    app.save_files('WORD-TEST',[bad])
                macro=io.BytesIO()
                with zipfile.ZipFile(macro,'w') as document:
                    document.writestr('[Content_Types].xml','<Types/>')
                    document.writestr('word/document.xml','<document/>')
                    document.writestr('word/vbaProject.bin',b'macro')
                with self.assertRaisesRegex(ValueError,'không khớp'):
                    app.save_files('WORD-TEST',[{**file,'data':base64.b64encode(macro.getvalue()).decode()}])

    def test_policy_is_pinned_to_the_case_and_guard_blocks_unreviewed_dossier(self):
        snapshot=workflows.snapshot(self.procedure)
        case={'procedureCode':self.procedure['code'],'workflow':snapshot}
        self.assertNotIn('submit_review',workflows.guard_summary(case)['allowedActions'])
        with patch.dict(workflows.PROFILES,{},clear=True):
            self.assertEqual(workflows.case_profile(case)['version'],snapshot['version'])
        evidence={f['id']:(f['options'][0] if f.get('options') else 'Nội dung kiểm tra đủ chi tiết theo nguồn công bố.') for f in snapshot['evidenceFields']}
        case['workflowEvidence']=evidence
        self.assertIn('submit_review',workflows.guard_summary(case)['allowedActions'])
        workflows.verify_evidence(snapshot,evidence)

    def test_cross_procedure_template_ids_are_rejected(self):
        doc=next(d for d in self.schema['documents'] if d['officialAttachments'])
        identifier=doc['officialAttachments'][0]['id']
        self.assertIsNotNone(published_template(self.procedure['code'],identifier))
        self.assertIsNone(published_template('2.000908',identifier))

    def test_all_activated_policies_have_required_source_data(self):
        for procedure in app.PROCEDURES:
            profile=workflows.configured_profile(procedure)
            if not profile or profile.get('kind')!='PUBLISHED_DOSSIER': continue
            with self.subTest(code=procedure['code']):
                self.assertTrue(profile['sourceHash'])
                self.assertTrue(profile['officialSteps'])
                self.assertTrue(profile['legalBases'])
                self.assertTrue(procedure['submission']['documents'])
                self.assertTrue(profile['channels'])
                if procedure['submissionEnabled']:
                    self.assertIn('ONLINE',profile['channels'])
                self.assertTrue(profile['sourceUrl'].startswith(('https://dichvucong.gov.vn/','https://dichvucong.moit.gov.vn/')))

if __name__=='__main__': unittest.main()
