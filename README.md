 Hello

## Auth redirect setup (Google login/signup)

To avoid OAuth callback issues like `DEPLOYMENT_NOT_FOUND`, keep your app URL configuration consistent:

- Set `NEXT_PUBLIC_APP_URL` in Vercel to your active app domain.
- In Supabase **Auth → URL Configuration**:
	- Set **Site URL** to the same domain.
	- Add these **Redirect URLs**:
		- `https://your-domain.com/auth/callback`
		- `http://localhost:3000/auth/callback`
- Redeploy after changing environment variables.
