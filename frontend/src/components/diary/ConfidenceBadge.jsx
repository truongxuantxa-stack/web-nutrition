import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

/**
 * Badge hiển thị mức độ tin cậy của dữ liệu cộng đồng.
 */
export default function ConfidenceBadge({ status, confidenceScore, dataSource }) {
    if (dataSource === 'openfoodfacts') {
        return (
            <span className="badge badge-success badge-sm gap-1">
                <CheckCircle className="w-3 h-3" />
                OpenFoodFacts
            </span>
        );
    }

    if (status === 'verified') {
        return (
            <span className="badge badge-success badge-sm gap-1">
                <CheckCircle className="w-3 h-3" />
                Đã xác minh
            </span>
        );
    }

    if (status === 'disputed') {
        return (
            <span className="badge badge-error badge-sm gap-1">
                <XCircle className="w-3 h-3" />
                Đang tranh luận
            </span>
        );
    }

    // unverified
    return (
        <span className="badge badge-warning badge-sm gap-1">
            <AlertTriangle className="w-3 h-3" />
            Chưa xác minh ({Math.round((confidenceScore || 0) * 100)}%)
        </span>
    );
}
