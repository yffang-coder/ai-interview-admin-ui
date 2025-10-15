<template>
   <div class="app-container">
      <el-form :model="queryParams" ref="queryRef" v-show="showSearch" :inline="true" label-width="68px">
        <el-form-item label="模型名称" prop="name">
        <el-input v-model="queryParams.name" placeholder="请输入名称" clearable style="width: 240px"
          @keyup.enter="handleQuery" />
      </el-form-item>
         <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
         </el-form-item>
      </el-form>
      <el-row :gutter="10" class="mb8">
         <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['ai:model:add']">新增</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate"
               v-hasPermi="['ai:model:update']">修改</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete"
               v-hasPermi="['ai:model:remove']">删除</el-button>
         </el-col>
         <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>

      <!-- 表格数据 -->
      <el-table v-loading="loading" :data="categoryItems" @selection-change="handleSelectionChange">
         <el-table-column type="selection" width="55" align="center" />
         <el-table-column label="编号" prop="id" width="120" />
         <el-table-column label="名称" prop="name" :show-overflow-tooltip="true" width="150" />
         <el-table-column label="模型地址" prop="url" :show-overflow-tooltip="true" width="150" />
         <el-table-column label="提问提示词" prop="questionPrompt" :show-overflow-tooltip="true" width="150" />

         <el-table-column label="回答提示词" prop="answerPrompt" :show-overflow-tooltip="true" width="150" />
         <el-table-column label="身份设定" prop="role" :show-overflow-tooltip="true" width="150" />

         <el-table-column label="是否收费" prop="category" width="150">
            <template #default="scope">
               <el-tag v-if="scope.row.charge == 1" type="primary">收费</el-tag>
               <el-tag v-else type="primary">免费</el-tag>
            </template>
         </el-table-column>
         <el-table-column label="是否支持多轮回话" prop="category" width="150">
            <template #default="scope">
               <el-tag v-if="scope.row.multiple == 1" type="primary">是</el-tag>
               <el-tag v-else type="primary">否</el-tag>
            </template>
         </el-table-column>



         <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
            <template #default="scope">
               <el-tooltip content="修改" placement="top">
                  <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
                     v-hasPermi="['ai:model:edit']"></el-button>
               </el-tooltip>
               <el-tooltip content="删除" placement="top">
                  <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
                     v-hasPermi="['ai:model:remove']"></el-button>
               </el-tooltip>
            </template>
         </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
         v-model:limit="queryParams.pageSize" @pagination="getList" />

      <!-- 添加或修改模型配置对话框 -->
      <el-dialog :title="title" v-model="open" width="500px" append-to-body>
         <el-form ref="modelsRef" :model="form" :rules="rules" label-width="100px">

            <el-form-item label="模型名称" prop="name">
               <el-input v-model="form.name" placeholder="请输入文本" />
            </el-form-item>
            <el-form-item label="调用地址" prop="url">
               <el-input v-model="form.url" placeholder="请输入url" />
            </el-form-item>
            <el-form-item label="提问提示词" prop="questionPrompt">
               <el-input v-model="form.questionPrompt" placeholder="请输入文本" />
            </el-form-item>
            <el-form-item label="回答提示词" prop="answerPrompt">
               <el-input v-model="form.answerPrompt" placeholder="请输入文本" />
            </el-form-item>
            <el-form-item label="身份设定" prop="role">
               <el-input v-model="form.role" placeholder="请输入文本" />
            </el-form-item>

            <el-form-item label="排序字段" prop="orderNum">
               <el-input-number v-model="form.orderNum" controls-position="right" :min="0" />
            </el-form-item>

            <el-form-item label="是否收费" prop="charge">
               <el-switch v-model="form.charge" active-value="1" inactive-value="0"
                 style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
                 active-text="是" inactive-text="否" />
            </el-form-item>

             <el-form-item label="是否支持多轮回话" prop="multiple">
               <el-switch v-model="form.multiple" active-value="1" inactive-value="0"
                 style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
                 active-text="是" inactive-text="否" />
            </el-form-item>

         </el-form>
         <template #footer>
            <div class="dialog-footer">
               <el-button type="primary" @click="submitForm">确 定</el-button>
               <el-button @click="cancel">取 消</el-button>
            </div>
         </template>
      </el-dialog>


   </div>
</template>

<script setup name="Role">

import { orderBy } from "element-plus/es/components/table/src/util.mjs"
import { listBanner, addBanner, getBanner, updateBanner, delBanner } from "../../../api/ai/banner"
import { addCategory, delCategory, getCategory, listCategory, updateCategory } from "../../../api/ai/category"
import { getToken } from "../../../utils/auth"
import { addCategoryItem, delCategoryItem, getCategoryItem, listCategoryItem, listCategoryNames, updateCategoryItem } from "../../../api/ai/categoryItem"
import { addModelItem, delModelItem, listModelItem, updateModelItem,getModelItem } from "../../../api/ai/models"

const router = useRouter()
const { proxy } = getCurrentInstance()

const categoryItems = ref([])
const categories = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")
const dateRange = ref([])
const headerObj = ref({ Authorization: "Bearer " + getToken() })


const data = reactive({
   form: {

   },
   queryParams: {
      pageNum: 1,
      pageSize: 10,
      name: undefined
   },
   rules: {
      name: [{ required: true, message: "名称不能为空", trigger: "blur" }],
      url: [{ required: true, message: "url不能为空", trigger: "blur" }],
      orderNum: [{ required: true, message: "排序字段不能为空", trigger: "blur" }],
      questionPrompt: [{ required: true, message: "问题提示词不能为空", trigger: "blur" }],
      answerPrompt: [{ required: true, message: "回答提示词不能为空", trigger: "blur" }],
      charge: [{ required: true, message: "是否收费不能为空", trigger: "blur" }],
      multiple: [{ required: true, message: "是否支持多轮不能为空", trigger: "blur" }],
      role: [{ required: true, message: "角色内容不能为空", trigger: "blur" }]
   },
})

const { queryParams, form, rules } = toRefs(data)


/** 查询模型列表 */
function getList() {
   loading.value = true
   listModelItem(proxy.addDateRange(queryParams.value, dateRange.value)).then(response => {
      categoryItems.value = response.rows
      total.value = response.total
      loading.value = false
   })
}

/** 搜索按钮操作 */
function handleQuery() {
   queryParams.value.pageNum = 1
   getList()
}

/** 重置按钮操作 */
function resetQuery() {
   dateRange.value = []
   proxy.resetForm("queryRef")
   handleQuery()
}

/** 删除按钮操作 */
function handleDelete(row) {
   const modelIds = row.id || ids.value
   proxy.$modal.confirm('是否确认删除编号为"' + modelIds + '"的数据项?').then(function () {
      return delModelItem(modelIds)
   }).then(() => {
      getList()
      proxy.$modal.msgSuccess("删除成功")
   }).catch(() => { })
}


/** 多选框选中数据 */
function handleSelectionChange(selection) {
   ids.value = selection.map(item => item.id)
   single.value = selection.length != 1
   multiple.value = !selection.length
}

/** 重置新增的表单以及其他数据  */
function reset() {
   form.value = {
      id: undefined,
      name: undefined,
      url: undefined,
      orderNum: undefined,
      questionPrompt: undefined,
      answerPrompt: undefined,
      charge: undefined,
      multiple: undefined,
      role: undefined
   }
   proxy.resetForm("modelsRef")
}

/** 添加模型 */
function handleAdd() {
   reset()
   open.value = true
   title.value = "添加模型内容"
}

/** 修改模型 */
function handleUpdate(row) {
   reset()
   const id = row.id || ids.value
   getModelItem(id).then(response => {
      form.value = response.data
      form.value.charge = String(response.data.charge)
      form.value.multiple = String(response.data.multiple)
      console.log(response.data)
      console.log(form.value)
      open.value = true
   })
   title.value = "修改模型内容"
}

/** 提交按钮 */
function submitForm() {
   proxy.$refs["modelsRef"].validate(valid => {
      if (valid) {
         if (form.value.id != undefined) {
            updateModelItem(form.value).then(response => {
               proxy.$modal.msgSuccess("修改成功")
               open.value = false
               getList()
            })
         } else {
            addModelItem(form.value).then(response => {
               proxy.$modal.msgSuccess("新增成功")
               open.value = false
               getList()
            })
         }
      }
   })
}

/** 取消按钮 */
function cancel() {
   open.value = false
   reset()
}


getList()
</script>
