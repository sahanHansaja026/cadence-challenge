import {
    useEffect,
    useState,
} from "react";

import {
    useAuth,
} from "../../context/AuthContext";

import {
    useAuthorizationCheck,
} from "../../authorization/AuthorizationCheck";

import Input from "../../component/ui/input";
import Button from "../../component/ui/Button";
import SidebarAdmin from "../../component/layout/sidebar-admin";
import api from "../../services/api";

type RuleType =
    | "TIERED"
    | "PRODUCT_OVERRIDE";

interface CommissionRule {
    id: string;
    company_id: string;
    name: string;
    rule_type: RuleType;
    product_code: string | null;
    effective_from: string;
    effective_to: string | null;
    min_amount: string;
    max_amount: string | null;
    commission_rate: string;
    created_at: string;
}

interface CommissionRuleForm {
    name: string;
    ruleType: RuleType;
    productCode: string;
    effectiveFrom: string;
    effectiveTo: string;
    minAmount: string;
    maxAmount: string;
    commissionRate: string;
}

const emptyForm: CommissionRuleForm = {
    name: "",
    ruleType: "TIERED",
    productCode: "",
    effectiveFrom: "",
    effectiveTo: "",
    minAmount: "0",
    maxAmount: "",
    commissionRate: "",
};

function CommissionRules() {

    const {
        isLoading,
    } = useAuth();

    const {
        adminAuthorization,
    } = useAuthorizationCheck();

    const [rules, setRules] =
        useState<CommissionRule[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [deleting, setDeleting] =
        useState<string | null>(null);

    const [showForm, setShowForm] =
        useState(false);

    const [editingId, setEditingId] =
        useState<string | null>(null);

    const [form, setForm] =
        useState<CommissionRuleForm>(
            emptyForm,
        );

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");


    /*
     * ADMIN AUTHORIZATION
     */
    useEffect(() => {

        if (!isLoading) {
            adminAuthorization();
        }

    }, [isLoading]);


    /*
     * GET COMMISSION RULES
     */
    useEffect(() => {

        if (!isLoading) {
            fetchRules();
        }

    }, [isLoading]);


    const fetchRules = async () => {

        try {

            setLoading(true);
            setError("");

            const token =
                localStorage.getItem("token");

            const response =
                await api.get(
                    "/commission-rules",
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    },
                );

            setRules(
                response.data.data.rules || [],
            );

        } catch (error: any) {

            console.error(
                "Get commission rules error:",
                error,
            );

            setError(
                error?.response?.data?.error
                    ?.message ||
                "Failed to load commission rules.",
            );

        } finally {

            setLoading(false);

        }
    };


    /*
     * CREATE NEW RULE
     */
    const openCreateForm = () => {

        setEditingId(null);

        setForm({
            ...emptyForm,
        });

        setMessage("");
        setError("");

        setShowForm(true);
    };


    /*
     * EDIT RULE
     */
    const openEditForm = (
        rule: CommissionRule,
    ) => {

        setEditingId(rule.id);

        setForm({
            name:
                rule.name,

            ruleType:
                rule.rule_type,

            productCode:
                rule.product_code || "",

            effectiveFrom:
                rule.effective_from
                    .substring(0, 10),

            effectiveTo:
                rule.effective_to
                    ? rule.effective_to
                        .substring(0, 10)
                    : "",

            minAmount:
                rule.min_amount,

            maxAmount:
                rule.max_amount || "",

            commissionRate:
                rule.commission_rate,
        });

        setMessage("");
        setError("");

        setShowForm(true);
    };


    /*
     * FORM FIELD UPDATE
     */
    const updateField = (
        field: keyof CommissionRuleForm,
        value: string,
    ) => {

        setForm(
            previous => ({
                ...previous,
                [field]: value,
            }),
        );

    };


    /*
     * CREATE / UPDATE
     */
    const handleSubmit = async (
        e: React.FormEvent,
    ) => {

        e.preventDefault();

        setMessage("");
        setError("");

        if (!form.name.trim()) {

            setError(
                "Rule name is required.",
            );

            return;
        }

        if (!form.effectiveFrom) {

            setError(
                "Effective from date is required.",
            );

            return;
        }

        if (!form.minAmount) {

            setError(
                "Minimum amount is required.",
            );

            return;
        }

        if (!form.commissionRate) {

            setError(
                "Commission rate is required.",
            );

            return;
        }

        if (
            form.ruleType ===
            "PRODUCT_OVERRIDE" &&
            !form.productCode.trim()
        ) {

            setError(
                "Product code is required for a product override rule.",
            );

            return;
        }

        try {

            setSaving(true);

            const token =
                localStorage.getItem("token");

            const data = {
                name:
                    form.name.trim(),

                ruleType:
                    form.ruleType,

                productCode:
                    form.ruleType ===
                        "PRODUCT_OVERRIDE"
                        ? form.productCode
                            .trim()
                            .toUpperCase()
                        : undefined,

                effectiveFrom:
                    form.effectiveFrom,

                effectiveTo:
                    form.effectiveTo ||
                    null,

                minAmount:
                    form.minAmount,

                maxAmount:
                    form.maxAmount ||
                    null,

                commissionRate:
                    form.commissionRate,
            };


            if (editingId) {

                await api.patch(
                    `/commission-rules/${editingId}`,
                    data,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    },
                );

                setMessage(
                    "Commission rule updated successfully.",
                );

            } else {

                await api.post(
                    "/commission-rules",
                    data,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    },
                );

                setMessage(
                    "Commission rule created successfully.",
                );
            }

            setShowForm(false);
            setEditingId(null);

            setForm({
                ...emptyForm,
            });

            await fetchRules();

        } catch (error: any) {

            console.error(
                "Save commission rule error:",
                error,
            );

            setError(
                error?.response?.data?.error
                    ?.message ||
                "Failed to save commission rule.",
            );

        } finally {

            setSaving(false);

        }
    };


    /*
     * DELETE RULE
     */
    const handleDelete = async (
        ruleId: string,
    ) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this commission rule?",
            );

        if (!confirmed) {
            return;
        }

        try {

            setDeleting(ruleId);
            setError("");
            setMessage("");

            const token =
                localStorage.getItem("token");

            await api.delete(
                `/commission-rules/${ruleId}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                },
            );

            setMessage(
                "Commission rule deleted successfully.",
            );

            await fetchRules();

        } catch (error: any) {

            console.error(
                "Delete commission rule error:",
                error,
            );

            setError(
                error?.response?.data?.error
                    ?.message ||
                "Failed to delete commission rule.",
            );

        } finally {

            setDeleting(null);

        }
    };


    if (isLoading || loading) {

        return (
            <div className="p-8">
                Loading commission rules...
            </div>
        );

    }


    return (
        <div className="flex min-h-screen bg-gray-50">

            {/* Sidebar */}

            <SidebarAdmin
                activeItem="Commission Rules"
            />


            {/* Main */}

            <main className="flex-1 p-8">

                {/* Header */}

                <div className="mb-8 flex items-center justify-between">

                    <div>

                        <h1 className="text-3xl font-bold text-gray-900">
                            Commission Rules
                        </h1>

                        <p className="mt-2 text-sm text-gray-500">
                            Create, update, and manage commission rules.
                        </p>

                    </div>


                    <Button
                        type="button"
                        variant="primary"
                        onClick={
                            openCreateForm
                        }
                    >
                        Create Commission Rule
                    </Button>

                </div>


                {/* Success */}

                {message && (
                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
                        {message}
                    </div>
                )}


                {/* Error */}

                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                        {error}
                    </div>
                )}


                {/* CREATE / EDIT FORM */}

                {showForm && (

                    <div className="mb-8 max-w-3xl rounded-xl border border-gray-200 bg-white p-6">

                        <h2 className="mb-6 text-xl font-semibold text-gray-900">

                            {editingId
                                ? "Edit Commission Rule"
                                : "Create Commission Rule"}

                        </h2>


                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="space-y-5"
                        >

                            {/* Name */}

                            <Input
                                label="Rule Name"
                                className="text-gray-900"
                                type="text"
                                placeholder="Standard Travel Commission"
                                value={
                                    form.name
                                }
                                required
                                onChange={(e) =>
                                    updateField(
                                        "name",
                                        e.target.value,
                                    )
                                }
                            />


                            {/* Rule Type */}

                            <div>

                                <label className="mb-2 block text-sm font-medium text-gray-900">
                                    Rule Type
                                </label>

                                <select
                                    value={
                                        form.ruleType
                                    }
                                    onChange={(e) =>
                                        updateField(
                                            "ruleType",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm"
                                >

                                    <option value="TIERED">
                                        Tiered
                                    </option>

                                    <option value="PRODUCT_OVERRIDE">
                                        Product Override
                                    </option>

                                </select>

                            </div>


                            {/* Product */}

                            {form.ruleType ===
                                "PRODUCT_OVERRIDE" && (

                                    <Input
                                        label="Product Code"
                                        type="text"
                                        placeholder="TRAVEL"
                                        value={
                                            form.productCode
                                        }
                                        required
                                        onChange={(e) =>
                                            updateField(
                                                "productCode",
                                                e.target.value,
                                            )
                                        }
                                    />

                                )}


                            {/* Effective From */}

                            <Input
                                label="Effective From"
                                type="date"
                                value={
                                    form.effectiveFrom
                                }
                                required
                                onChange={(e) =>
                                    updateField(
                                        "effectiveFrom",
                                        e.target.value,
                                    )
                                }
                            />


                            {/* Effective To */}

                            <Input
                                label="Effective To"
                                type="date"
                                value={
                                    form.effectiveTo
                                }
                                onChange={(e) =>
                                    updateField(
                                        "effectiveTo",
                                        e.target.value,
                                    )
                                }
                            />


                            {/* Min */}

                            <Input
                                label="Minimum Amount"
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                    form.minAmount
                                }
                                required
                                onChange={(e) =>
                                    updateField(
                                        "minAmount",
                                        e.target.value,
                                    )
                                }
                            />


                            {/* Max */}

                            <Input
                                label="Maximum Amount"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Optional"
                                value={
                                    form.maxAmount
                                }
                                onChange={(e) =>
                                    updateField(
                                        "maxAmount",
                                        e.target.value,
                                    )
                                }
                            />


                            {/* Rate */}

                            <Input
                                label="Commission Rate (%)"
                                type="number"
                                min="0"
                                max="100"
                                step="0.001"
                                value={
                                    form.commissionRate
                                }
                                required
                                onChange={(e) =>
                                    updateField(
                                        "commissionRate",
                                        e.target.value,
                                    )
                                }
                            />


                            {/* Buttons */}

                            <div className="flex gap-3">

                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={
                                        saving
                                    }
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId
                                            ? "Update Rule"
                                            : "Create Rule"}
                                </Button>


                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                        setShowForm(
                                            false,
                                        );

                                        setEditingId(
                                            null,
                                        );

                                        setForm({
                                            ...emptyForm,
                                        });
                                    }}
                                >
                                    Cancel
                                </Button>

                            </div>

                        </form>

                    </div>

                )}


                {/* RULE TABLE */}

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

                    <div className="border-b border-gray-200 px-6 py-4">

                        <h2 className="font-semibold text-gray-900">
                            Existing Commission Rules
                        </h2>

                    </div>


                    {rules.length === 0 ? (

                        <div className="p-8 text-center text-gray-500">

                            No commission rules found.

                        </div>

                    ) : (

                        <div className="overflow-x-auto">

                            <table className="w-full text-left text-sm">

                                <thead className="bg-gray-50 text-xs uppercase text-gray-500">

                                    <tr>

                                        <th className="px-6 py-4">
                                            Name
                                        </th>

                                        <th className="px-6 py-4">
                                            Type
                                        </th>

                                        <th className="px-6 py-4">
                                            Product
                                        </th>

                                        <th className="px-6 py-4">
                                            Min
                                        </th>

                                        <th className="px-6 py-4">
                                            Max
                                        </th>

                                        <th className="px-6 py-4">
                                            Rate
                                        </th>

                                        <th className="px-6 py-4">
                                            Effective From
                                        </th>

                                        <th className="px-6 py-4">
                                            Actions
                                        </th>

                                    </tr>

                                </thead>


                                <tbody className="divide-y divide-gray-100">

                                    {rules.map(
                                        rule => (

                                            <tr
                                                key={
                                                    rule.id
                                                }
                                                className="hover:bg-gray-50"
                                            >

                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {
                                                        rule.name
                                                    }
                                                </td>


                                                <td className="px-6 py-4">
                                                    {
                                                        rule.rule_type
                                                    }
                                                </td>


                                                <td className="px-6 py-4">
                                                    {
                                                        rule.product_code ||
                                                        "-"
                                                    }
                                                </td>


                                                <td className="px-6 py-4">
                                                    {
                                                        rule.min_amount
                                                    }
                                                </td>


                                                <td className="px-6 py-4">
                                                    {
                                                        rule.max_amount ||
                                                        "No limit"
                                                    }
                                                </td>


                                                <td className="px-6 py-4 font-medium">
                                                    {
                                                        rule.commission_rate
                                                    }%
                                                </td>


                                                <td className="px-6 py-4">
                                                    {
                                                        rule.effective_from
                                                    }
                                                </td>


                                                <td className="px-6 py-4">

                                                    <div className="flex gap-2">

                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            onClick={() =>
                                                                openEditForm(
                                                                    rule,
                                                                )
                                                            }
                                                        >
                                                            Edit
                                                        </Button>


                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            disabled={
                                                                deleting ===
                                                                rule.id
                                                            }
                                                            onClick={() =>
                                                                handleDelete(
                                                                    rule.id,
                                                                )
                                                            }
                                                        >
                                                            {deleting ===
                                                                rule.id
                                                                ? "Deleting..."
                                                                : "Delete"}
                                                        </Button>

                                                    </div>

                                                </td>

                                            </tr>

                                        ))}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </main>

        </div>
    );
}

export default CommissionRules;