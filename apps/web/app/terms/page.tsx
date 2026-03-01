import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service - 1Place2Post',
    description: 'Terms of Service for using the 1Place2Post platform.',
};

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-[#faf9f5] font-['Lora',serif] text-[#141413] pb-20 leading-relaxed text-[16px]">

            {/* Brand Header */}
            <div className="bg-[#141413] text-[#faf9f5] py-16 px-8 text-center mb-16">
                <div className="max-w-[800px] mx-auto">
                    <h1 className="text-4xl md:text-5xl font-['Poppins',sans-serif] font-semibold m-0 text-[#faf9f5]">Terms of Service</h1>
                    <p className="mt-4 text-[#b0aea5] font-['Poppins',sans-serif] font-light text-xl">
                        Rules, guidelines, and agreements for using our platform
                    </p>
                </div>
            </div>

            {/* Main Content Container */}
            <div className="max-w-[1200px] mx-auto px-6 sm:px-12 flex justify-center">
                <div className="max-w-[800px] w-full">
                    <p className="text-[1.125rem] text-[#b0aea5] italic mb-10">Last Updated: February 28, 2026</p>

                    <div className="space-y-12 text-[1.125rem] text-[#141413]">

                        <section>
                            <h2 className="text-[2.25rem] font-['Poppins',sans-serif] font-semibold text-[#141413] mt-8 mb-4 pb-2 border-b-2 border-[#e8e6dc]">1. Acceptance of Terms</h2>
                            <p className="mb-5">
                                By accessing and using 1Place2Post ("the Service") at <a href="https://1place2post.techstruction.co" className="text-[#6a9bcc] hover:underline">1place2post.techstruction.co</a>, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-[2.25rem] font-['Poppins',sans-serif] font-semibold text-[#141413] mt-8 mb-4 pb-2 border-b-2 border-[#e8e6dc]">2. Description of Service</h2>
                            <p className="mb-5">
                                1Place2Post is a platform that allows users to manage and publish content across multiple social media platforms simultaneously. We provide the tools to authenticate social accounts (such as TikTok, X, LinkedIn, YouTube, Instagram, Facebook, etc.) and post text, images, and videos.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-[2.25rem] font-['Poppins',sans-serif] font-semibold text-[#141413] mt-8 mb-4 pb-2 border-b-2 border-[#e8e6dc]">3. User Obligations</h2>
                            <p className="mb-4">
                                By using the Service, you agree to the following obligations:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mb-5 text-[#141413]">
                                <li><strong className="font-['Poppins',sans-serif] font-medium">Rights to publish:</strong> You will only post content that you own or have the explicit right to publish.</li>
                                <li><strong className="font-['Poppins',sans-serif] font-medium">Acceptable Use:</strong> You agree not to publish explicit, harmful, abusive, defamatory, or offensive material.</li>
                                <li><strong className="font-['Poppins',sans-serif] font-medium">Platform Rules:</strong> You agree to comply strictly with the respective Terms of Service of all third-party platforms that you connect to our Service.</li>
                                <li><strong className="font-['Poppins',sans-serif] font-medium">Security:</strong> You are responsible for maintaining the confidentiality of your account credentials and ensuring no unauthorized access occurs.</li>
                            </ul>

                            <div className="p-6 border-l-4 border-[#d97757] bg-[#d97757]/10 rounded-r-lg mt-6">
                                <strong className="font-['Poppins',sans-serif] text-[#141413]">Warning:</strong> Violation of these obligations may result in immediate suspension or permanent termination of your 1Place2Post account.
                            </div>
                        </section>

                        <section>
                            <h2 className="text-[2.25rem] font-['Poppins',sans-serif] font-semibold text-[#141413] mt-8 mb-4 pb-2 border-b-2 border-[#e8e6dc]">4. Third-Party Services and APIs</h2>
                            <p className="mb-5">
                                1Place2Post utilizes third-party APIs to deliver its services. Your use of these platforms through 1Place2Post is strictly governed by the Terms of Service of those third-party networks. 1Place2Post is indirectly acting as an authenticated agent on your behalf. We are not responsible for any bans, suspensions, or rate limits placed on your accounts by third-party platforms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-[2.25rem] font-['Poppins',sans-serif] font-semibold text-[#141413] mt-8 mb-4 pb-2 border-b-2 border-[#e8e6dc]">5. Disclaimer of Warranties</h2>
                            <p className="mb-5">
                                Our Service is provided on an "as is" and "as available" basis. 1Place2Post makes no representations or warranties of any kind, express or implied, as to the operation of their services, or the information, content, materials, or products included on the Service. You expressly agree that your use of the Service is at your sole risk.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-[2.25rem] font-['Poppins',sans-serif] font-semibold text-[#141413] mt-8 mb-4 pb-2 border-b-2 border-[#e8e6dc]">6. Limitation of Liability</h2>
                            <p className="mb-5">
                                In no event shall 1Place2Post, its directors, employees, or agents be liable to you or any third party for any direct, indirect, consequential, exemplary, incidental, special or punitive damages, including lost profit, lost revenue, loss of data or other damages arising from your use of the Service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-[2.25rem] font-['Poppins',sans-serif] font-semibold text-[#141413] mt-8 mb-4 pb-2 border-b-2 border-[#e8e6dc]">7. Modifications to the Service</h2>
                            <p className="mb-5">
                                Prices for our products (if applicable) are subject to change without notice. We reserve the right at any time to modify or discontinue the Service (or any part or content thereof) without notice at any time.
                            </p>

                            <div className="p-6 border-l-4 border-[#788c5d] bg-[#788c5d]/10 rounded-r-lg mt-6">
                                <strong className="font-['Poppins',sans-serif] text-[#141413]">Account Updates:</strong> We will strive to provide active users with advanced notice of major changes or deprecations to supported social networks.
                            </div>
                        </section>

                        <section>
                            <h2 className="text-[2.25rem] font-['Poppins',sans-serif] font-semibold text-[#141413] mt-8 mb-4 pb-2 border-b-2 border-[#e8e6dc]">8. Contact Information</h2>
                            <p className="mb-5">
                                If you have any questions regarding these Terms of Service, please contact us at: <a href="mailto:support@1place2post.techstruction.co" className="text-[#6a9bcc] hover:underline font-['Poppins',sans-serif]">support@1place2post.techstruction.co</a>.
                            </p>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
}
