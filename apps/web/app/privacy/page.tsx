import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy - 1Place2Post',
    description: 'Privacy Policy for 1Place2Post handling of your data and social media accounts.',
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl w-full bg-white p-8 rounded-lg shadow">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
                <p className="text-sm text-gray-500 mb-8">Last Updated: February 28, 2026</p>

                <div className="prose prose-blue max-w-none text-gray-700 space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
                        <p>
                            Welcome to 1Place2Post. We respect your privacy and are committed to protecting your personal data.
                            This privacy policy will inform you about how we look after your personal data when you visit our
                            website (1place2post.techstruction.co) and tell you about your privacy rights and how the law protects you.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Data We Collect</h2>
                        <p>
                            We may collect, use, store and transfer different kinds of personal data about you, including:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
                            <li><strong>Contact Data:</strong> includes email address.</li>
                            <li><strong>Social Media Data:</strong> includes access tokens, refresh tokens, and basic profile information from third-party social media platforms (such as TikTok, X/Twitter, LinkedIn, YouTube, Instagram, Facebook) that you authorize our application to interact with.</li>
                            <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Data</h2>
                        <p>
                            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>To provide, operate, and maintain our application.</li>
                            <li>To authorize and verify your linked social media accounts on platforms like TikTok.</li>
                            <li>To post content to your authorized social media accounts on your behalf, strictly as directed by you.</li>
                            <li>To notify you about changes to our terms or privacy policy.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Third-Party Integrations</h2>
                        <p>
                            Our service interacts with third-party social media platforms via their respective APIs (e.g., TikTok API, Twitter API). By authenticating your account with these services, you are subject to their respective privacy policies and terms of service. 1Place2Post does not sell your social media data. We only store the tokens necessary to securely connect to these platforms on your behalf.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Retention & Deletion</h2>
                        <p>
                            We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements. You may request the deletion of your account and all associated data, including OAuth tokens, by contacting our support team or unlinking your social platforms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Security</h2>
                        <p>
                            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed, particularly regarding the secure storage of OAuth tokens.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Contact Us</h2>
                        <p>
                            If you have any questions about this privacy policy or our privacy practices, please contact us at support@1place2post.techstruction.co.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
