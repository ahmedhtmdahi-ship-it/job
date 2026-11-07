from datetime import datetime,timezone,timedelta
from ahmed_jobs.matching import is_expired
from ahmed_jobs.safety import canonical

def test_exact_expiry_timestamp_in_current_day():
    assert is_expired((datetime.now(timezone.utc)-timedelta(seconds=5)).isoformat())
    assert not is_expired((datetime.now(timezone.utc)+timedelta(days=2)).isoformat())

def test_linkedin_tracking_slug_does_not_create_new_identity():
    a=canonical('https://www.linkedin.com/jobs/view/analyst-company-123456789?trackingId=abc')
    b=canonical('https://www.linkedin.com/jobs/view/123456789/?refId=def')
    assert a==b=='https://www.linkedin.com/jobs/view/123456789/'
