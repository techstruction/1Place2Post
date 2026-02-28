# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - heading "Welcome back" [level=1] [ref=e4]
    - paragraph [ref=e5]: Sign in to your 1Place2Post account
    - generic [ref=e6]:
      - generic [ref=e7]:
        - generic [ref=e8]: Email
        - textbox [active] [ref=e9]
      - generic [ref=e10]:
        - generic [ref=e11]: Password
        - textbox [ref=e12]
      - button "Sign in" [ref=e13] [cursor=pointer]
    - generic [ref=e16]: or
    - link "Google Continue with Google" [ref=e18] [cursor=pointer]:
      - /url: https://1place2post-st.techstruction.co/api/auth/google
      - img "Google" [ref=e19]
      - text: Continue with Google
    - paragraph [ref=e20]:
      - text: No account?
      - link "Sign up" [ref=e21] [cursor=pointer]:
        - /url: /register
  - alert [ref=e22]
```