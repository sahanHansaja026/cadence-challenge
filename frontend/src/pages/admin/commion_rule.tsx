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
     * LOAD COMMISSION RULES
     */
    useEffect(() => {

        if (!isLoading) {
            fetchRules();
        }

    }, [isLoading]);


    /*
     * GET COMMISSION RULES
     */
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
                response.data?.data?.rules || [],
            );

        } catch (error: any) {

            console.error(
                "Get commission rules error:",
                error,
            );


            const message =
                error?.response?.data?.error
                    ?.message;


            setError(
                message ||
                "Failed to load commission rules.",
            );

        } finally {

            setLoading(false);

        }
    };


    /*
     * OPEN CREATE FORM
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
     * OPEN EDIT FORM
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
                    ? rule.effective_to.substring(0, 10)
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
     * UPDATE FORM FIELD
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
     * CHANGE RULE TYPE
     */
    const handleRuleTypeChange = (
        value: RuleType,
    ) => {

        setForm(
            previous => ({
                ...previous,

                ruleType:
                    value,

                /*
                 * Product code only belongs
                 * to PRODUCT_OVERRIDE.
                 *
                 * When changing back to TIERED,
                 * remove the product code.
                 */
                productCode:
                    value === "PRODUCT_OVERRIDE"
                        ? previous.productCode
                        : "",
            }),
        );

    };


    /*
     * VALIDATE FORM
     */
    const validateForm = (): boolean => {

        if (!form.name.trim()) {

            setError(
                "Rule name is required.",
            );

            return false;
        }


        if (!form.effectiveFrom) {

            setError(
                "Effective from date is required.",
            );

            return false;
        }


        if (
            form.effectiveTo &&
            form.effectiveTo <
            form.effectiveFrom
        ) {

            setError(
                "Effective to date cannot be before effective from date.",
            );

            return false;
        }


        if (
            form.ruleType ===
            "PRODUCT_OVERRIDE" &&
            !form.productCode.trim()
        ) {

            setError(
                "Product code is required for a product override rule.",
            );

            return false;
        }


        if (
            form.ruleType ===
            "TIERED" &&
            form.productCode.trim()
        ) {

            setError(
                "Tiered rules cannot have a product code.",
            );

            return false;
        }


        const min =
            Number(form.minAmount);


        if (
            form.minAmount === "" ||
            Number.isNaN(min) ||
            min < 0
        ) {

            setError(
                "Minimum amount must be zero or greater.",
            );

            return false;
        }


        if (form.maxAmount !== "") {

            const max =
                Number(form.maxAmount);


            if (
                Number.isNaN(max) ||
                max < min
            ) {

                setError(
                    "Maximum amount must be greater than or equal to minimum amount.",
                );

                return false;
            }
        }


        const rate =
            Number(form.commissionRate);


        if (
            form.commissionRate === "" ||
            Number.isNaN(rate) ||
            rate < 0 ||
            rate > 100
        ) {

            setError(
                "Commission rate must be between 0 and 100.",
            );

            return false;
        }


        return true;
    };


    /*
     * CREATE / UPDATE COMMISSION RULE
     */
    const handleSubmit = async (
        e: React.FormEvent,
    ) => {

        e.preventDefault();

        setMessage("");
        setError("");


        if (!validateForm()) {
            return;
        }


        try {

            setSaving(true);


            const token =
                localStorage.getItem("token");


            /*
             * IMPORTANT:
             *
             * PRODUCT_OVERRIDE
             * -> productCode is sent.
             *
             * TIERED
             * -> productCode is explicitly null.
             */
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
                        : null,

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


            /*
             * UPDATE
             */
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

            }

            /*
             * CREATE
             */
            else {

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


            /*
             * Reset form.
             */
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


            const backendError =
                error?.response?.data?.error;


            setError(
                backendError?.message ||
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


    /*
     * CLOSE FORM
     */
    const closeForm = () => {

        setShowForm(false);

        setEditingId(null);

        setForm({
            ...emptyForm,
        });

        setError("");
    };


    /*
     * LOADING
     */
    if (isLoading || loading) {

        return (
            <div className="p-8">
                Loading commission rules...
            </div>
        );

    }


    return (
        <div className="flex min-h-screen bg-gray-50">

            {/* SIDEBAR */}

            <SidebarAdmin
                activeItem="Commission Rules"
            />


            {/* MAIN */}

            <main className="flex-1 p-8">

                {/* HEADER */}

                <div className="mb-8 flex items-center justify-between">

                    <div>

                        <h1 className="text-3xl font-bold text-gray-900">
                            Commission Rules
                        </h1>

                        <p className="mt-2 text-sm text-gray-500">
                            Create and manage tiered and product override commission rules.
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


                {/* SUCCESS */}

                {message && (

                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">

                        {message}

                    </div>

                )}


                {/* ERROR */}

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

                            {/* RULE NAME */}

                            <Input
                                label="Rule Name"
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


                            {/* RULE TYPE */}

                            <div>

                                <label className="mb-2 block text-sm font-medium text-gray-900">

                                    Rule Type

                                </label>


                                <select
                                    value={
                                        form.ruleType
                                    }
                                    onChange={(e) =>
                                        handleRuleTypeChange(
                                            e.target.value as RuleType,
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


                                <p className="mt-1 text-xs text-gray-500">

                                    {form.ruleType ===
                                        "PRODUCT_OVERRIDE"
                                        ? "This rule applies to the selected product and takes priority over tiered rules."
                                        : "This rule applies company-wide based on the booking amount."}

                                </p>

                            </div>


                            {/* PRODUCT CODE */}

                            {form.ruleType ===
                                "PRODUCT_OVERRIDE" && (

                                    <div>

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
                                                    e.target.value
                                                        .toUpperCase(),
                                                )
                                            }
                                        />

                                        <p className="mt-1 text-xs text-gray-500">
                                            Example: TRAVEL, HOTEL, FLIGHT
                                        </p>

                                    </div>

                                )}


                            {/* EFFECTIVE FROM */}

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


                            {/* EFFECTIVE TO */}

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


                            <p className="-mt-3 text-xs text-gray-500">
                                Leave empty for an open-ended rule.
                            </p>


                            {/* MINIMUM */}

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


                            {/* MAXIMUM */}

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


                            <p className="-mt-3 text-xs text-gray-500">
                                Leave empty for no maximum amount.
                            </p>


                            {/* COMMISSION RATE */}

                            <Input
                                label="Commission Rate (%)"
                                type="number"
                                min="0"
                                max="100"
                                step="0.001"
                                placeholder="Example: 5"
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


                            {/* BUTTONS */}

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
                                    onClick={
                                        closeForm
                                    }
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
                                            Effective To
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

                                                {/* NAME */}

                                                <td className="px-6 py-4 font-medium text-gray-900">

                                                    {
                                                        rule.name
                                                    }

                                                </td>


                                                {/* TYPE */}

                                                <td className="px-6 py-4">

                                                    {rule.rule_type ===
                                                        "PRODUCT_OVERRIDE" ? (

                                                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                                                            Product Override
                                                        </span>

                                                    ) : (

                                                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                                                            Tiered
                                                        </span>

                                                    )}

                                                </td>


                                                {/* PRODUCT */}

                                                <td className="px-6 py-4">

                                                    {rule.product_code
                                                        ? (
                                                            <span className="font-medium text-gray-900">
                                                                {
                                                                    rule.product_code
                                                                }
                                                            </span>
                                                        )
                                                        : (
                                                            "-"
                                                        )}

                                                </td>


                                                {/* MIN */}

                                                <td className="px-6 py-4">

                                                    {
                                                        rule.min_amount
                                                    }

                                                </td>


                                                {/* MAX */}

                                                <td className="px-6 py-4">

                                                    {
                                                        rule.max_amount ||
                                                        "No limit"
                                                    }

                                                </td>


                                                {/* RATE */}

                                                <td className="px-6 py-4 font-medium">

                                                    {
                                                        rule.commission_rate
                                                    }%

                                                </td>


                                                {/* EFFECTIVE FROM */}

                                                <td className="px-6 py-4">

                                                    {
                                                        rule.effective_from
                                                            .substring(0, 10)
                                                    }

                                                </td>


                                                {/* EFFECTIVE TO */}

                                                <td className="px-6 py-4">

                                                    {
                                                        rule.effective_to
                                                            ? rule.effective_to
                                                                .substring(0, 10)
                                                            : "No expiry"
                                                    }

                                                </td>


                                                {/* ACTIONS */}

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

                                        ),
                                    )}

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