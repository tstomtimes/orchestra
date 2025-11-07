# Deployment Rollout Status

**Environment:** production
**Deployment URL:** https://app.example.com
**Timestamp:** 2025-11-03 15:26:32 UTC
**Deployed By:** tstomtimes
**Git Commit:** 25de397
**Git Branch:** main

## Smoke Test Results

| Test | Status |
|------|--------|
| Health Endpoint | ❌ Fail |
| API Endpoints | ❌ Fail |
| Database Connectivity | ❌ Fail |

## Rollback Procedure

If issues are detected, rollback using:

```bash
# Vercel
vercel rollback <deployment-url>

# Kubernetes
kubectl rollout undo deployment/<deployment-name> -n <namespace>

# Docker / Docker Compose
docker-compose down && git checkout <previous-commit> && docker-compose up -d

# Heroku
heroku releases:rollback -a <app-name>
```

## Monitoring

- **Logs:** `kubectl logs -f deployment/<name>` or check your logging service
- **Metrics:** Check Datadog/Grafana/CloudWatch dashboards
- **Errors:** Monitor Sentry/error tracking service
- **Performance:** Check response times and error rates

## Next Steps

- [ ] Monitor error rates for next 30 minutes
- [ ] Check user-facing features manually
- [ ] Verify analytics/tracking is working
- [ ] Announce deployment in team channel
- [ ] Update release notes

---

**Status:** ❌ Deployment Failed - Consider Rollback
