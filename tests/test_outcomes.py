import pytest
from ahmed_jobs.storage import Store
from ahmed_jobs.outcomes import receipt_evidence,reconcile

@pytest.mark.parametrize('reference,url,confirmed',[
 ('Thank you','https://example.org/receipt',True),('OK','https://example.org/receipt',True),
 ('ABC123','https://evil.org/receipt',True),('ABC123','https://example.org/receipt',False)])
def test_generic_success_cross_origin_and_unreviewed_receipt_rejected(reference,url,confirmed):
    with pytest.raises(ValueError):receipt_evidence('https://example.org/job',reference,url,confirmed)

def test_manual_receipt_can_reconcile_but_never_sends(tmp_path):
    s=Store(tmp_path);p={'action':'application','destination':'https://example.org/job','text':'Reviewed','eligibility':'eligible'}
    did=s.save_draft(p);s.approve(did);aid=s.begin_attempt(did);s.recover()
    assert reconcile(s,aid,'submitted',{'receipt_id':'REQ-123','receipt_url':'https://example.org/applications/REQ-123','confirmed':True})=='submitted'
    assert s.draft(did)['state']=='submitted'
    with pytest.raises(ValueError):s.begin_attempt(did)
    s.close()

def test_uncertain_never_retried_without_explicit_checked_history(tmp_path):
    s=Store(tmp_path);p={'action':'application','destination':'https://example.org/job','text':'Reviewed','eligibility':'eligible'}
    did=s.save_draft(p);s.approve(did);aid=s.begin_attempt(did);s.recover()
    with pytest.raises(ValueError):reconcile(s,aid,'not_submitted')
    assert s.draft(did)['state']=='uncertain'
    assert reconcile(s,aid,'not_submitted',confirmed_no_submission=True)=='failed'
    with pytest.raises(ValueError):s.begin_attempt(did)
    s.approve(did);assert s.begin_attempt(did)!=aid
    s.close()
