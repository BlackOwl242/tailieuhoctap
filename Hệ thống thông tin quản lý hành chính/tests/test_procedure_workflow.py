"""Checks for procedure-specific declarations and evidence-based public progress."""
import unittest
from unittest.mock import patch
from datetime import datetime
import app


class ProcedureWorkflowTests(unittest.TestCase):
    def body(self):
        return {"schemaVersion": "1.004237-704-2025-v2", "confirmed": True, "deliveryMethod": "Điện tử", "declaration": {"nationalityType": "Trong nước", "submissionRole": "Tự nộp", "address": "Địa chỉ liên hệ", "identityNumber": "TEST-ID", "dataRequested": "Dữ liệu môi trường tại khu vực được yêu cầu", "purpose": "Đối chiếu thông tin", "exploitationMethod": "Nhận dữ liệu điện tử", "commitment": "Sử dụng đúng mục đích đã khai"}}

    def validate(self, body, files=None, applicant="citizen"):
        return app.validate_procedure_submission(app.PROCEDURE_BY_CODE["1.004237"], body, applicant, files if files is not None else [{"componentId": "request02"}])

    def test_document_variants_and_foreign_declaration(self):
        body = self.body()
        self.validate(body)
        body["declaration"]["nationalityType"] = "Cá nhân nước ngoài tại Việt Nam"
        with self.assertRaisesRegex(ValueError, "Nơi làm việc"):
            self.validate(body)
        body["declaration"].update(workplace="Nơi học tập", nationality="TEST", passport="TEST-PASSPORT")
        with self.assertRaisesRegex(ValueError, "không thuộc"):
            self.validate(body)
        declaration, _, _ = self.validate(body, [{"componentId": "request03"}])
        self.assertNotIn("identityNumber", declaration)
        self.assertEqual(declaration["passport"], "TEST-PASSPORT")

    def test_organization_uses_02_and_representative(self):
        body = self.body()
        with self.assertRaisesRegex(ValueError, "Người ký"):
            self.validate(body, applicant="organization")
        body["declaration"]["representative"] = "Người ký kiểm thử"
        declaration, _, _ = self.validate(body, applicant="organization")
        self.assertNotIn("identityNumber", declaration)

    def test_required_declaration_documents_version_and_confirmation(self):
        for field in ["purpose", "commitment", "dataRequested", "exploitationMethod", "address"]:
            body = self.body(); body["declaration"].pop(field)
            with self.subTest(field=field), self.assertRaises(ValueError): self.validate(body)
        with self.assertRaisesRegex(ValueError, "Thiếu thành phần"): self.validate(self.body(), [])
        body = self.body(); body["schemaVersion"] = "old"
        with self.assertRaisesRegex(ValueError, "phiên bản"): self.validate(body)
        body = self.body(); body["confirmed"] = False
        with self.assertRaisesRegex(ValueError, "xác nhận"): self.validate(body)

    def test_postal_delivery_requires_address(self):
        body = self.body(); body["deliveryMethod"] = "Bưu chính"
        with self.assertRaisesRegex(ValueError, "địa chỉ"): self.validate(body)
        body["deliveryAddress"] = "Địa chỉ nhận kết quả kiểm thử"
        self.validate(body)

    def test_delegate_fields_are_required_only_for_submission_on_behalf(self):
        body = self.body()
        body["declaration"]["submissionRole"] = "Nộp thay theo ủy quyền"
        with self.assertRaisesRegex(ValueError, "người nộp thay"):
            self.validate(body)
        body["declaration"].update(submitterName="Người nộp thay", submitterIdentity="TEST-ID", submitterAddress="Địa chỉ liên hệ")
        declaration, _, _ = self.validate(body)
        self.assertEqual(declaration["submitterName"], "Người nộp thay")
        body["declaration"]["submitterEmail"] = "invalid"
        with self.assertRaisesRegex(ValueError, "Email không hợp lệ"):
            self.validate(body)
        body["declaration"]["submissionRole"] = "Tự nộp"
        declaration, _, _ = self.validate(body)
        self.assertNotIn("submitterName", declaration)

    def test_service_classification_does_not_enable_unconfigured_forms(self):
        self.assertEqual(app.PROCEDURE_BY_CODE["1.004237"]["serviceMode"], "FULL")
        partial = next(p for p in app.PROCEDURES if p["serviceMode"] == "PARTIAL" and not p.get("submissionEnabled"))
        info = next(p for p in app.PROCEDURES if p["serviceMode"] == "INFORMATION")
        for procedure in [partial, info]:
            with self.assertRaisesRegex(ValueError, "biểu mẫu"):
                app.validate_procedure_submission(procedure, self.body(), "citizen", [])

    def progress(self, status, actions, payload=None):
        events = [{"action": action, "at": "2026-10-11T10:00:00+07:00"} for action in actions]
        with patch.object(app, "events_for", return_value=events):
            return {p["id"]: p["state"] for p in app.case_progress(None, {"id": 1, "status": status}, payload or {})}

    def test_rejection_does_not_complete_later_stages(self):
        states = self.progress("TU_CHOI", ["submit", "reject_intake"])
        self.assertEqual(states["intake"], "terminated")
        self.assertEqual(states["handling"], "pending")
        self.assertEqual(states["delivery"], "pending")
        states = self.progress("KHONG_GIAI_QUYET", ["submit", "accept", "assign", "submit_review", "decline"])
        self.assertEqual(states["review"], "terminated")
        self.assertEqual(states["issue"], "pending")

    def test_supplement_stays_at_real_stage_and_send_back_reopens_handling(self):
        states = self.progress("CHO_BO_SUNG", ["submit", "request_supplement"], {"supplement": {"resumeStatus": "CHO_TIEP_NHAN"}})
        self.assertEqual(states["intake"], "paused")
        self.assertEqual(states["handling"], "pending")
        states = self.progress("CHO_BO_SUNG", ["submit", "accept", "assign", "request_supplement"], {"supplement": {"resumeStatus": "DANG_THU_LY"}})
        self.assertEqual(states["intake"], "completed")
        self.assertEqual(states["handling"], "paused")
        states = self.progress("DANG_THU_LY", ["submit", "accept", "assign", "submit_review", "send_back"])
        self.assertEqual(states["handling"], "current")
        self.assertEqual(states["review"], "pending")

    def test_internal_progress_is_sanitized(self):
        events = [{"id": 1, "action": "assign", "audience": "internal", "title": "Internal", "detail": "PRIVATE", "at": "now"}, {"id": 2, "action": "save_draft", "audience": "internal", "title": "Draft", "detail": "PRIVATE", "at": "now"}]
        with patch.object(app, "events_for", return_value=events): result = app.citizen_processing_events(None, 1)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["detail"], "")
        self.assertNotIn("PRIVATE", str(result))

    def test_same_day_deadline_at_fifteen_and_after_fifteen(self):
        with patch.object(app, "is_workday", return_value=True), patch.object(app, "next_workday", return_value=datetime(2026, 10, 13).date()):
            self.assertEqual(app.compute_deadline("2.000908", datetime(2026, 10, 12, 15, tzinfo=app.TZ))[0], "2026-10-12")
            self.assertEqual(app.compute_deadline("2.000908", datetime(2026, 10, 12, 15, 0, 1, tzinfo=app.TZ))[0], "2026-10-13")
        self.assertIsNone(app.compute_deadline("1.004237", datetime.now(app.TZ))[0])


if __name__ == "__main__": unittest.main()
