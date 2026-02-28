import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service - 1Place2Post',
    description: 'Terms of Service for using the 1Place2Post platform.',
};

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl w-full bg-white p-8 rounded-lg shadow">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
                <p className="text-sm text-gray-500 mb-8">Last Updated: February 28, 2026</p>

                <div className="prose prose-blue max-w-none text-gray-700 space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using 1Place2Post ("the Service") at 1place2post.techstruction.co, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
                        <p>
                            1Place2Post is a platform that allows users to manage and publish content across multiple social media platforms simultaneously. We provide the tools to authenticate social accounts (such as TikTok, X, LinkedIn, etc.) and post text, images, and videos.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">3. User Obligations</h2>
                        <p>
                            By using the Service, you agree to the following obligations:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>You will only post content that you have the right to publish.</li>
                            <li>You agree not to publish explicit, harmful, abusive, or generally offensive material.</li>
                            <li>You agree to comply with the respective Terms of Service of all third-party platforms (such as TikTok, YouTube, etc.) that you connect to our Service.</li>
                            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Third-Party Services and APIs</h2>
                        <p>
                            1Place2Post utilizes third-party APIs to deliver its services. Your use of these platforms through 1Place2Post is strictly governed by the Terms of Service of those third-party networks. 1Place2Post is not responsible for any bans, suspensions, or limit constraints placed on your accounts by third-party platforms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Disclaimer of Warranties</h2>
                        <p>
                            Our Service is provided on an "as is" and "as available" basis. 1Place2Post makes no representations or warranties of any kind, express or implied, as to the operation of their services, or the information, content, materials, or products included on the Service. You expressly agree that your use of the Service is at your sole risk.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Limitation of Liability</h2>
                        <p>
                            In no event shall 1Place2Post, its directors, employees, or agents be liable to you or any third party for any direct, indirect, consequential, exemplary, incidental, special or punitive damages, including lost profit, lost revenue, loss of data or other damages arising from your use of the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Modifications to the Service and Prices</h2>
                        <p>
                            Prices for our products are subject to change without notice. We reserve the right at any time to modify or discontinue the Service (or any part or content thereof) without notice at any time.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contact Information</h2>
                        <p>
                            If you have any questions regarding these Terms of Service, please contact us at support@1place2post.techstruction.co.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
