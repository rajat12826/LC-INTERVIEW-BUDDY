import { dodopayments } from "./dodopayments";

async function listProducts() {
    try {
        const products=await dodopayments.products.list()
        console.log("------------PRODUCT START----------");
        
        console.log(products);
        console.log("------------PRODUCT END----------");
        
    } catch (error) {
        console.log(error);
        
    }
}
listProducts()