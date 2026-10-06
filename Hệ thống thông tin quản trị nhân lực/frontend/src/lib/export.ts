function saveBlob(blob: Blob, filename: string) {
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export async function downloadWordFromHtml(title:string,bodyHtml:string):Promise<void>{
 const {Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,HeadingLevel,WidthType}=await import('docx');
 const dom=new DOMParser().parseFromString(bodyHtml,'text/html');
 const children:(InstanceType<typeof Paragraph>|InstanceType<typeof Table>)[]=[];
 for(const node of Array.from(dom.body.children)){
   if(node.tagName==='TABLE'){
     const rows=Array.from(node.querySelectorAll('tr')).map(tr=>new TableRow({children:Array.from(tr.querySelectorAll('th,td')).map(td=>new TableCell({children:[new Paragraph({children:[new TextRun({text:td.textContent??'',bold:td.tagName==='TH'})]})]}))}));
     if(rows.length)children.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},rows}));
   }else{children.push(new Paragraph({text:node.textContent??'',heading:node.tagName==='H1'?HeadingLevel.HEADING_1:node.tagName==='H2'?HeadingLevel.HEADING_2:undefined,spacing:{after:120}}));}
 }
 const doc=new Document({title,styles:{default:{document:{run:{font:'Times New Roman',size:26}}}},sections:[{properties:{page:{margin:{top:1134,bottom:1134,left:1417,right:1134}}},children}]});
 saveBlob(await Packer.toBlob(doc),`${title}.docx`);
}
export async function exportRowsToExcel(filename:string,headers:string[],rows:(string|number)[][]):Promise<void>{
 const ExcelJS=await import('exceljs');const wb=new ExcelJS.Workbook();const ws=wb.addWorksheet('Dữ liệu');
 ws.addRow(headers);for(const row of rows)ws.addRow(row.map(v=>typeof v==='number'&&Number.isFinite(v)?v:String(v??'')));
 ws.getRow(1).font={bold:true};ws.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFDCE6F1'}};
 headers.forEach((h,i)=>{ws.getColumn(i+1).width=Math.min(55,Math.max(15,h.length+3));});ws.views=[{state:'frozen',ySplit:1}];ws.autoFilter={from:{row:1,column:1},to:{row:Math.max(1,rows.length+1),column:headers.length}};
 const buf=await wb.xlsx.writeBuffer();saveBlob(new Blob([new Uint8Array(buf)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),`${filename}.xlsx`);
}
