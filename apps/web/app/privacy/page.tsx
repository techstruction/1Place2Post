import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy - 1Place2Post',
    description: 'Privacy Policy for 1Place2Post handling of your data and social media accounts.',
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-[#faf9f5] font-['Lora',serif] text-[#141413] pb-20 leading-relaxed text-[16px]">

            {/* Brand Header */}
            <div className="bg-[#141413] text-[#faf9f5] py-16 px-8 text-center mb-16">
                <div className="max-w-[800px] mx-auto">
                    <h1 className="text-4xl md:text-5xl font-['Poppins',sans-serif] font-semibold m-0 text-[#faf9f5]">Privacy Policy</h1>
                    <p className="mt-4 text-[#b0aea5] font-['Poppins',sans-serif] font-light text-xl">
                        How we protect and manage your data
                    </p>
                </div>
            </div>

            {/* Main Content Container */}
            <div className="max-w-[1200px] mx-auto px-6 sm:px-12 flex justify-center">
                <div className="max-w-[800px] w-full">
                    <p className="text-[1.125rem] text-[#b0aea5] italic mb-10">Last Updated: February 28, 2026</p>

                    <div className="space-y-12 text-[1.125rem] text-[#141413]">

                        <section>
                            <h2 className="text-[2.25rem] font-['Poppins',sans-serif] font-semibold text-[#141413] mt-8 mb-4 pb-2 border-b-2 border-[#e8e6dc]">1. Introduction</h2>
                            <p className="mb-5">
                                Welcome to 1Place2Post. We respect your privacy and are committed to protecting your personal data.
                                This privacy policy will inform you about how we look after your personal data when you visit our
                                website (<a href="https://1place2post.techstruction.co" className="text-[#6a9bcc] hover:underline">1place2post.techstruction.co</a>) and tell you about your privacy rights and how the law protects you.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-[2.25rem] font-['Poppins',sans-serif] font-semibold text-[#141413] mt-8 mb-4 pb-2 border-b-2 border-[#e8e6dc]">2. Data We Collect</h2>
                            <p className="mb-4">
                                We may collect, use, store and transfer different kinds of personal data about you, including:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mb-5 text-[#141413]">
                                <li><strong className="font-['Poppins',sans-serif] font-medium">Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
                                <li><strong className="font-['Poppins',sans-serif] font-medium">Contact Data:</strong> includes email address.</li>
                                <li><strong className="font-['Poppins',sans-serif] font-medium">Social Media Data:</strong> includes access tokens, refresh tokens, and basic profile information from third-party social media platforms (such as TikTok, X/Twitter, LinkedIn, YouTube, Instagram, Facebook) that you authorize our application to interact with.</li>
                                <li><strong className="font-['Poppins',sans-serif] font-medium">Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version.</li>
                            </ul>

                            <div className="p-6 border-l-4 border-[#6a9bcc] bg-[#6a9bcc]/10 rounded-r-lg mt-6">
                                <strong className="font-['Poppins',sans-serif] text-[#141413]">Information:</strong> We only request the essential permissions needed to publish to your social platforms securely. We do not excessively harvest unnecessary social data.
                            </div>
                        </section>

                        <section>
                            <h2 className="text-[2.25rem] font-['Poppins',sans-serif] font-semibold text-[#141413] mt-8 mb-4 pb-2 border-b-2 border-[#e8e6dc]">3. How We Use Your Data</h2>
                            <p className="mb-4">
                                We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mb-5 text-[#141413]">
                                <li>To provide, operate, and maintain our application.</li>
                                <li>To authorize and verify your linked social media accounts on platforms like TikTok and others.</li>
                                <li>To post content to your authorized social media accounts on your behalf, strictly as directed by you.</li>
                                <li>To notify you about changes to our terms or privacy policy.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-[2.25rem] font-['Poppins',sans-serif] font-semibold text-[#141413] mt-8 mb-4 pb-2 border-b-2 border-[#e8e6dc]">4. Third-Party Integrations</h2>
                            <p className="mb-5">
                                Our service interacts with third-party social media platforms via their respective APIs (e.g., TikTok API, Twitter API). By authenticating your account with these services, you are subject to their respective privacy policies and terms of service. 1Place2Post does not sell your social media data. We only store the tokens necessary to securely connect to these platforms on your behalf.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-[2.25rem] font-['Poppins',sans-serif] font-semibold text-[#141413] mt-8 mb-4 pb-2 border-b-2 border-[#e8e6dc]">5. Data Retention & Deletion</h2>
                            <p className="mb-5">
                                We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements. You may request the deletion of your account and all associated data, including OAuth tokens, by contacting our support team or unlinking your social platforms.
                            </p>

                            <div className="p-6 border-l-4 border-[#d97757] bg-[#d97757]/10 rounded-r-lg mt-6">
                                <strong className="font-['Poppins',sans-serif] text-[#141413]">Important Action:</strong> Unlinking an account from your 1Place2Post dashboard will immediately permanently destroy our associated OAuth access tokens for that platform.
                            </div>
                        </section>

                        <section>
                            <h2 className="text-[2.25rem] font-['Poppins',sans-serif] font-semibold text-[#141413] mt-8 mb-4 pb-2 border-b-2 border-[#e8e6dc]">6. Security</h2>
                            <p className="mb-5">
                                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed, particularly regarding the secure storage of OAuth tokens. All access credentials are encrypted at rest using industry-standard techniques.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-[2.25rem] font-['Poppins',sans-serif] font-semibold text-[#141413] mt-8 mb-4 pb-2 border-b-2 border-[#e8e6dc]">7. Contact Us</h2>
                            <p className="mb-5">
                                If you have any questions about this privacy policy or our privacy practices, please contact us at: <a href="mailto:support@1place2post.techstruction.co" className="text-[#6a9bcc] hover:underline font-['Poppins',sans-serif]">support@1place2post.techstruction.co</a>.
                            </p>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
}
