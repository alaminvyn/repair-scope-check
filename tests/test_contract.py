"""Unit tests for response validation with a minimal GenVM import stub."""
import importlib.util
from pathlib import Path
import sys
from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import patch


identity = lambda function: function
genlayer = SimpleNamespace(
    contract=SimpleNamespace(Contract=object),
    public=SimpleNamespace(write=identity, view=identity),
    storage=SimpleNamespace(TreeMap=dict),
)
path = Path(__file__).resolve().parents[1] / "contracts" / "repair_scope_check.py"
spec = importlib.util.spec_from_file_location("repair_scope_check", path)
contract = importlib.util.module_from_spec(spec)
with patch.dict(sys.modules, {"genlayer": genlayer}):
    spec.loader.exec_module(contract)


class ResponseValidation(TestCase):
    quote = "Replace the kitchen tap. Pipework behind the wall is excluded."

    def test_three_supported_outcomes(self):
        for kind, excerpt in (
            ("INCLUDED", "Replace the kitchen tap."),
            ("APPROVAL_REQUIRED", "Pipework behind the wall is excluded."),
            ("UNCLEAR", ""),
        ):
            with self.subTest(kind=kind):
                self.assertTrue(contract.well_formed({
                    "verdict": kind, "quote_excerpt": excerpt, "explanation": "Test explanation."
                }, self.quote))

    def test_rejects_fabricated_evidence_and_unknown_verdict(self):
        for kind, excerpt in (("INCLUDED", "New walls are included."), ("OTHER", ""), ("INCLUDED", "")):
            with self.subTest(kind=kind):
                self.assertFalse(contract.well_formed({
                    "verdict": kind, "quote_excerpt": excerpt, "explanation": "Test explanation."
                }, self.quote))

    def test_rejects_malformed_response(self):
        self.assertFalse(contract.well_formed({"verdict": "INCLUDED"}, self.quote))
        self.assertFalse(contract.well_formed(None, self.quote))


class ConsensusGating(TestCase):
    owner = "0x" + "1" * 40
    case_id = "a" * 32
    scope = "Pipework behind the wall is excluded."
    work = "Replace a pipe inside the wall."

    def run_case(self, independent_verdict):
        class Return:
            def __init__(self, calldata):
                self.calldata = calldata

        def run_nondet(propose, validate):
            candidate = propose()
            if not validate(Return(candidate)):
                raise ValueError("Validator rejected the result")
            return candidate

        leader = {
            "verdict": "APPROVAL_REQUIRED",
            "quote_excerpt": self.scope,
            "explanation": "The quote expressly excludes the proposed pipework.",
        }
        independent = {**leader, "verdict": independent_verdict}
        fake_vm = SimpleNamespace(Return=Return, run_nondet_unsafe=run_nondet)
        fake_gl = SimpleNamespace(
            message=SimpleNamespace(sender_address=self.owner), vm=fake_vm, UserError=ValueError,
        )
        case = contract.RepairScopeCheck()
        case.results = {}
        with patch.object(contract, "gl", fake_gl), patch.object(
            contract, "evaluate", side_effect=[leader, independent]
        ) as model:
            case.assess(self.case_id, self.scope, self.work)
            self.assertEqual(model.call_count, 2)
            with self.assertRaisesRegex(ValueError, "already has a verdict"):
                case.assess(self.case_id, self.scope, self.work)
        return case

    def test_independent_agreement_stores_verdict(self):
        case = self.run_case("APPROVAL_REQUIRED")
        self.assertIn("APPROVAL_REQUIRED", case.get_verdict(self.owner, self.case_id))
        self.assertEqual(case.get_verdict("0x" + "2" * 40, self.case_id), "")

    def test_disagreement_rejects_the_leader_result(self):
        with self.assertRaisesRegex(ValueError, "Validator rejected"):
            self.run_case("UNCLEAR")
