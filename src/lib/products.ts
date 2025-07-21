import { dodoPayments } from "./dodopayments";

async function listProducts() {
    try {
        const products=await dodoPayments.products.list()
        console.log("------------PRODUCT START----------");
        
        console.log(products);
        console.log("------------PRODUCT END----------");
        
    } catch (error) {
        console.log(error);
        
    }
}
listProducts()