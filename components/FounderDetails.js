export default function FounderDetails({ founderInfo, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Contact the Finder</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-green-800">Ownership Verified!</span>
          </div>
          <p className="text-green-700 text-sm">
            You've successfully proven ownership of this item. Here are the finder's contact details:
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Finder Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <span className="font-medium text-gray-700 w-16">Name:</span>
                <span className="text-gray-900">{founderInfo.name}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-700 w-16">Email:</span>
                <a 
                  href={`mailto:${founderInfo.email}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {founderInfo.email}
                </a>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-700 w-16">Phone:</span>
                <a 
                  href={`tel:${founderInfo.phone}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {founderInfo.phone}
                </a>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Item Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start">
                <span className="font-medium text-gray-700 w-20">Found at:</span>
                <span className="text-gray-900">{founderInfo.location}</span>
              </div>
              <div className="flex items-start">
                <span className="font-medium text-gray-700 w-20">Date:</span>
                <span className="text-gray-900">{founderInfo.date}</span>
              </div>
              <div className="flex items-start">
                <span className="font-medium text-gray-700 w-20">Details:</span>
                <span className="text-gray-900">{founderInfo.description}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-amber-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.168 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="font-medium text-amber-800 mb-1">Safety Reminder</h4>
              <p className="text-amber-700 text-sm">
                Please meet in a safe, public location on campus. Bring proper identification to prove ownership when collecting your item.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <a
            href={`mailto:${founderInfo.email}?subject=Found Item Claim&body=Hi ${founderInfo.name}, I believe you found my item. I've verified ownership through the security questions. Can we arrange a time to meet?`}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium text-center transition-colors"
          >
            📧 Send Email
          </a>
          <a
            href={`tel:${founderInfo.phone}`}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium text-center transition-colors"
          >
            📞 Call Now
          </a>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-3 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}