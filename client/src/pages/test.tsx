import { useState } from "react";


const BASE_URL = import.meta.env.VITE_API_URL;

const TestCallingPage = () => {

    const [data, setData] = useState<{ success: boolean, data: any } | null>(null)
    const [loading, setLoading] = useState(false)


    const makeCall = async () => {
        try {
            setLoading(true)
            const data = await fetch(`${BASE_URL}/community/test`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })
            const res = await data.json()

            console.log("Data from AI", res)

            setData(res)
        } catch (e) {
            console.log((e as Error).message);
        } finally {
            setLoading(false)
        }
    }
    const exportMealPDF = async () => {
        try {
            setLoading(true)
            const res = await fetch(`http://localhost:8080/api/export/meal/pdf`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/pdf",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
            })

            const data = await res.blob()

            if (!data) {
                console.log("No data")
                return
            }

            console.log("Data from AI", data)
            const url = URL.createObjectURL(data)

            console.log("URL", url)

            // window.open(url, "_blank")
        } catch (e) {
            console.log((e as Error).message);
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-2xl font-bold">Loading...</p>
            </div>
        )
    }

    return (
        <div className="p-5">
            <div className="flex gap-5">
                <button onClick={makeCall} className="bg-blue-500 text-white px-4 py-2 rounded-md">get feed posts</button>
                <button onClick={exportMealPDF} className="bg-blue-500 text-white px-4 py-2 rounded-md">export meal pdf</button>

            </div>

            {/* render data */}
            <div className="mt-5">
                <p>{data ? <pre>{JSON.stringify(data, null, 2)}</pre> : "No data"}</p>
            </div>

        </div>
    )
}

export default TestCallingPage